import { Router } from "express";
import { z } from "zod";
import { Attempt } from "../models/Attempt";
import { Exam } from "../models/Exam";
import { ExamSpace } from "../models/ExamSpace";
import { Question } from "../models/Question";
import { IntegrityLog } from "../models/IntegrityLog";
import { auth, requireRole, AuthRequest } from "../middleware/auth";
import { evaluateObjective } from "../utils/evaluate";

const router = Router();

async function buildAttempt(exam: any, studentId: string) {
  const questions = await Question.find({ _id: { $in: exam.questionIds } }).lean();
  const snapshot = questions.map((q: any) => ({
    questionId: q._id,
    questionText: q.questionText,
    type: q.type,
    options: q.options,
    marks: q.marks,
    negativeMarks: exam.negativeMarking ? (q.negativeMarks || exam.defaultNegativeMarks) : 0,
    correctAnswer: q.correctAnswer
  }));
  const startedAt = new Date();
  const deadline = new Date(startedAt.getTime() + exam.durationMinutes * 60_000);
  return Attempt.create({
    examId: exam._id,
    studentId,
    startedAt,
    serverDeadline: deadline,
    questionSnapshot: snapshot
  });
}

function publicAttempt(a: any) {
  const copy = a.toObject ? a.toObject() : { ...a };
  copy.questionSnapshot = (copy.questionSnapshot || []).map((q: any) => {
    const { correctAnswer, ...safe } = q;
    return safe;
  });
  return copy;
}

// ── Student: Start or resume attempt ──────────────────────────────────────────
router.post("/start/:examId", auth, requireRole("student"), async (req: AuthRequest, res) => {
  const exam = await Exam.findById(req.params.examId);
  if (!exam) return res.status(404).json({ message: "Exam not found" });
  const space = await ExamSpace.findOne({ examId: exam._id, studentIds: req.user!.id, active: true });
  if (!space) return res.status(403).json({ message: "You are not assigned to this exam" });

  const now = new Date();
  if (now < exam.startTime || now > exam.endTime)
    return res.status(400).json({ message: "Exam is not currently available" });

  let attempt = await Attempt.findOne({ examId: exam._id, studentId: req.user!.id });
  if (attempt) {
    if (attempt.status !== "in_progress")
      return res.status(400).json({ message: "This exam attempt is already closed" });
    if (new Date() > attempt.serverDeadline) {
      await submitAttempt(attempt, "auto_submitted");
      return res.status(400).json({ message: "Attempt expired and was auto-submitted" });
    }
    const populated = await Attempt.findById(attempt._id).populate("examId", "title subject security durationMinutes");
    return res.json(publicAttempt(populated));
  }

  attempt = await buildAttempt(exam, req.user!.id);
  const populated = await Attempt.findById(attempt._id).populate("examId", "title subject security durationMinutes");
  res.status(201).json(publicAttempt(populated));
});

// ── Student: Get attempt (populated) ─────────────────────────────────────────
router.get("/:id", auth, requireRole("student"), async (req: AuthRequest, res) => {
  const a = await Attempt.findOne({ _id: req.params.id, studentId: req.user!.id })
    .populate("examId", "title subject security durationMinutes showScore showPassFail showCorrectAnswers showStudentAnswers showExplanations resultMode passingMarks totalMarks");
  if (!a) return res.status(404).json({ message: "Attempt not found" });
  res.json(publicAttempt(a));
});

// ── Student: Save answer ──────────────────────────────────────────────────────
router.patch("/:id/answer", auth, requireRole("student"), async (req: AuthRequest, res) => {
  const body = z.object({
    questionId: z.string(),
    selectedAnswer: z.any().optional(),
    markedForReview: z.boolean().optional()
  }).parse(req.body);

  const a = await Attempt.findOne({ _id: req.params.id, studentId: req.user!.id });
  if (!a || a.status !== "in_progress") return res.status(400).json({ message: "Attempt is not active" });
  if (new Date() > a.serverDeadline) {
    await submitAttempt(a, "auto_submitted");
    return res.status(400).json({ message: "Time expired" });
  }

  const idx = a.answers.findIndex(x => String(x.questionId) === body.questionId);
  const data: any = {
    questionId: body.questionId,
    selectedAnswer: body.selectedAnswer,
    markedForReview: body.markedForReview ?? false,
    answeredAt: new Date()
  };
  if (idx >= 0) a.answers[idx] = data;
  else a.answers.push(data);
  await a.save();
  res.json({ ok: true, serverTime: new Date(), deadline: a.serverDeadline });
});

// ── Submit logic ──────────────────────────────────────────────────────────────
async function submitAttempt(attempt: any, status: "submitted" | "auto_submitted") {
  if (attempt.status !== "in_progress") return attempt;
  const result = evaluateObjective(attempt.questionSnapshot, attempt.answers);
  const manualScore = 0;
  attempt.status = status;
  attempt.submittedAt = new Date();
  attempt.score = result.score + manualScore;
  attempt.objectiveScore = result.score;
  attempt.manualScore = manualScore;
  attempt.correctAnswers = result.correct;
  attempt.incorrectAnswers = result.incorrect;
  attempt.unanswered = result.unanswered;
  attempt.timeTakenSeconds = Math.max(0, Math.round((attempt.submittedAt.getTime() - attempt.startedAt.getTime()) / 1000));
  await attempt.save();
  return attempt;
}

// ── Student: Report violation ─────────────────────────────────────────────────
router.post("/:id/violation", auth, requireRole("student"), async (req: AuthRequest, res) => {
  const body = z.object({
    type: z.enum(["TAB_SWITCH", "WINDOW_BLUR", "FULLSCREEN_EXIT", "PAGE_HIDDEN", "NAVIGATION", "DUPLICATE_SESSION", "OTHER"]),
    details: z.string().optional()
  }).parse(req.body);

  const a = await Attempt.findOne({ _id: req.params.id, studentId: req.user!.id }).populate("examId");
  if (!a || a.status !== "in_progress") return res.status(400).json({ message: "Attempt is not active" });

  const exam: any = a.examId;
  a.violationCount += 1;
  const autoSubmit = exam?.security?.autoSubmitOnViolation !== false;

  await IntegrityLog.create({
    attemptId: a._id,
    studentId: req.user!.id,
    examId: exam._id,
    type: body.type,
    details: body.details || "",
    action: autoSubmit ? "AUTO_SUBMITTED" : "RECORDED"
  });

  if (autoSubmit) {
    await submitAttempt(a, "auto_submitted");
    return res.json({ autoSubmitted: true, status: a.status });
  }

  await a.save();
  res.json({ autoSubmitted: false, status: a.status });
});

// ── Student: Manual submit ────────────────────────────────────────────────────
router.post("/:id/submit", auth, requireRole("student"), async (req: AuthRequest, res) => {
  const a = await Attempt.findOne({ _id: req.params.id, studentId: req.user!.id });
  if (!a) return res.status(404).json({ message: "Attempt not found" });
  if (a.status !== "in_progress") {
    const populated = await Attempt.findById(a._id).populate("examId", "title subject showScore showPassFail showCorrectAnswers showStudentAnswers showExplanations resultMode passingMarks totalMarks");
    return res.json(publicAttempt(populated));
  }
  const status = new Date() > a.serverDeadline ? "auto_submitted" : "submitted";
  await submitAttempt(a, status);
  const populated = await Attempt.findById(a._id).populate("examId", "title subject showScore showPassFail showCorrectAnswers showStudentAnswers showExplanations resultMode passingMarks totalMarks");
  res.json(publicAttempt(populated));
});

// ── Student: Attempt history ──────────────────────────────────────────────────
router.get("/student/history/all", auth, requireRole("student"), async (req: AuthRequest, res) => {
  const attempts = await Attempt.find({ studentId: req.user!.id })
    .populate("examId", "title subject startTime durationMinutes resultMode showScore showPassFail passingMarks totalMarks")
    .sort({ createdAt: -1 });
  res.json(attempts);
});

export default router;
