import { Router } from "express";
import { Attempt } from "../models/Attempt";
import { IntegrityLog } from "../models/IntegrityLog";
import { Exam } from "../models/Exam";
import { auth, requireRole } from "../middleware/auth";

const router = Router();
router.use(auth, requireRole("admin"));

router.get("/attempts", async (req, res) => {
  const filter: any = {};
  if (req.query.examId) filter.examId = req.query.examId;
  const attempts = await Attempt.find(filter).populate("studentId", "name registerNumber department year section").populate("examId", "title subject").sort({ submittedAt: -1 });
  res.json(attempts);
});

router.get("/integrity", async (req, res) => {
  const filter: any = {};
  if (req.query.examId) filter.examId = req.query.examId;
  const logs = await IntegrityLog.find(filter).populate("studentId", "name registerNumber").populate("examId", "title").sort({ detectedAt: -1 });
  res.json(logs);
});

router.get("/dashboard", async (_req, res) => {
  const [students, exams, attempts, integrity] = await Promise.all([
    (await import("../models/User")).User.countDocuments({ role: "student" }),
    Exam.countDocuments(),
    Attempt.countDocuments(),
    IntegrityLog.countDocuments()
  ]);
  res.json({ students, exams, attempts, integrity });
});

export default router;
