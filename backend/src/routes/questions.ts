import { Router } from "express";
import { z } from "zod";
import { Question } from "../models/Question";
import { auth, requireRole } from "../middleware/auth";

const router = Router();
router.use(auth, requireRole("admin"));

const schema = z.object({
  questionText: z.string().min(1),
  type: z.enum(["single_choice", "multiple_choice", "true_false", "numerical", "short_answer", "descriptive"]),
  options: z.array(z.object({ key: z.string(), text: z.string() })).default([]),
  correctAnswer: z.any().optional(),
  marks: z.number().min(0),
  negativeMarks: z.number().min(0).default(0),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  subject: z.string().min(1),
  topic: z.string().default(""),
  explanation: z.string().default("")
});

router.get("/", async (req, res) => {
  const filter: any = {};
  if (req.query.subject) filter.subject = req.query.subject;
  if (req.query.difficulty) filter.difficulty = req.query.difficulty;
  const questions = await Question.find(filter).sort({ createdAt: -1 });
  res.json(questions);
});

router.post("/", async (req, res) => {
  const q = await Question.create(schema.parse(req.body));
  res.status(201).json(q);
});

router.patch("/:id", async (req, res) => {
  const q = await Question.findByIdAndUpdate(req.params.id, schema.partial().parse(req.body), { new: true });
  if (!q) return res.status(404).json({ message: "Question not found" });
  res.json(q);
});

router.delete("/:id", async (req, res) => {
  await Question.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

export default router;
