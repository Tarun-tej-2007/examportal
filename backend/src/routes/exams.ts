import { Router } from "express";
import { z } from "zod";
import { Exam } from "../models/Exam";
import { ExamSpace } from "../models/ExamSpace";
import { Question } from "../models/Question";
import { User } from "../models/User";
import { auth, requireRole, AuthRequest } from "../middleware/auth";

const router = Router();

const examSchema = z.object({
  title: z.string().min(2),
  subject: z.string().min(1),
  description: z.string().default(""),
  instructions: z.array(z.string()).default([]),
  durationMinutes: z.number().int().positive(),
  totalMarks: z.number().min(0),
  passingMarks: z.number().min(0),
  negativeMarking: z.boolean().default(false),
  defaultNegativeMarks: z.number().min(0).default(0),
  questionIds: z.array(z.string()).default([]),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  resultMode: z.enum(["immediate", "manual", "scheduled"]).default("immediate"),
  resultReleaseAt: z.coerce.date().optional(),
  showScore: z.boolean().default(true),
  showPassFail: z.boolean().default(true),
  showCorrectAnswers: z.boolean().default(false),
  showStudentAnswers: z.boolean().default(false),
  showExplanations: z.boolean().default(false),
  security: z.object({
    requireFullscreen: z.boolean().default(true),
    detectTabSwitch: z.boolean().default(true),
    detectWindowBlur: z.boolean().default(true),
    detectFullscreenExit: z.boolean().default(true),
    autoSubmitOnViolation: z.boolean().default(true),
    preventMultipleSessions: z.boolean().default(true)
  }).default({})
});

// ── Admin: List all exams ─────────────────────────────────────────────────────
router.get("/admin", auth, requireRole("admin"), async (_req, res) => {
  res.json(await Exam.find().sort({ startTime: -1 }));
});

// ── Admin: Get single exam by ID ──────────────────────────────────────────────
router.get("/admin/:id", auth, requireRole("admin"), async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) return res.status(404).json({ message: "Exam not found" });
  res.json(exam);
});

// ── Admin: Create exam ────────────────────────────────────────────────────────
router.post("/", auth, requireRole("admin"), async (req: AuthRequest, res) => {
  const body = examSchema.parse(req.body);
  if (body.endTime <= body.startTime)
    return res.status(400).json({ message: "End time must be after start time" });
  const exam = await Exam.create({ ...body, createdBy: req.user!.id, status: "scheduled" });
  await ExamSpace.create({ examId: exam._id, name: `${exam.title} Space`, studentIds: [] });
  res.status(201).json(exam);
});

// ── Admin: Update exam ────────────────────────────────────────────────────────
router.patch("/:id", auth, requireRole("admin"), async (req, res) => {
  const exam = await Exam.findByIdAndUpdate(req.params.id, examSchema.partial().parse(req.body), { new: true });
  if (!exam) return res.status(404).json({ message: "Exam not found" });
  res.json(exam);
});

// ── Admin: Update exam questions list ─────────────────────────────────────────
router.patch("/:id/questions", auth, requireRole("admin"), async (req, res) => {
  const { questionIds } = z.object({ questionIds: z.array(z.string()) }).parse(req.body);
  // Validate that all question IDs exist
  const validQuestions = await Question.find({ _id: { $in: questionIds } }).select("_id marks");
  const validIds = validQuestions.map(q => q._id);
  // Recalculate totalMarks from the selected questions
  const totalMarks = validQuestions.reduce((sum, q) => sum + q.marks, 0);
  const exam = await Exam.findByIdAndUpdate(
    req.params.id,
    { questionIds: validIds, totalMarks },
    { new: true }
  );
  if (!exam) return res.status(404).json({ message: "Exam not found" });
  res.json(exam);
});

// ── Admin: Get exam space ─────────────────────────────────────────────────────
router.get("/:id/space", auth, requireRole("admin"), async (req, res) => {
  const space = await ExamSpace.findOne({ examId: req.params.id })
    .populate("studentIds", "name email registerNumber department year section");
  if (!space) return res.status(404).json({ message: "Exam space not found" });
  res.json(space);
});

// ── Admin: Update exam space ──────────────────────────────────────────────────
router.patch("/:id/space", auth, requireRole("admin"), async (req, res) => {
  const body = z.object({
    name: z.string().min(1).optional(),
    studentIds: z.array(z.string()).optional(),
    active: z.boolean().optional()
  }).parse(req.body);
  const validIds = body.studentIds
    ? await User.find({ _id: { $in: body.studentIds }, role: "student" }).distinct("_id")
    : undefined;
  const space = await ExamSpace.findOneAndUpdate(
    { examId: req.params.id },
    { ...body, ...(validIds ? { studentIds: validIds } : {}) },
    { new: true, upsert: true }
  ).populate("studentIds", "name email registerNumber department year section");
  res.json(space);
});

// ── Student: Get available exams ──────────────────────────────────────────────
router.get("/student/available", auth, requireRole("student"), async (req: AuthRequest, res) => {
  const spaces = await ExamSpace.find({ studentIds: req.user!.id, active: true });
  const ids = spaces.map(s => s.examId);
  const exams = await Exam.find({ _id: { $in: ids }, status: { $in: ["scheduled", "live"] } })
    .sort({ startTime: 1 });
  res.json(exams);
});

// ── Student: Get single exam (no questionIds exposed) ────────────────────────
router.get("/student/:id", auth, requireRole("student"), async (req: AuthRequest, res) => {
  const space = await ExamSpace.findOne({ examId: req.params.id, studentIds: req.user!.id, active: true });
  if (!space) return res.status(403).json({ message: "You are not assigned to this exam" });
  const exam = await Exam.findById(req.params.id).select("-questionIds");
  if (!exam) return res.status(404).json({ message: "Exam not found" });
  res.json(exam);
});

export default router;
