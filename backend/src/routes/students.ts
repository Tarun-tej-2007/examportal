import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { User } from "../models/User";
import { auth, requireRole, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(auth, requireRole("admin"));

const studentSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6).optional(),
  registerNumber: z.string().min(1),
  rollNumber: z.string().optional(),
  department: z.string().optional(),
  year: z.string().optional(),
  section: z.string().optional()
});

router.get("/", async (_req, res) => {
  const students = await User.find({ role: "student" }).select("-passwordHash").sort({ name: 1 });
  res.json(students);
});

router.post("/", async (req: AuthRequest, res) => {
  const body = studentSchema.parse(req.body);
  const passwordHash = await bcrypt.hash(body.password || body.registerNumber, 12);
  const student = await User.create({ ...body, passwordHash, role: "student" });
  res.status(201).json(student.toObject({ transform: (_doc, ret: any) => { delete ret.passwordHash; return ret; } }));
});

router.patch("/:id", async (req, res) => {
  const body = studentSchema.partial().omit({ password: true }).parse(req.body);
  const student = await User.findOneAndUpdate({ _id: req.params.id, role: "student" }, body, { new: true }).select("-passwordHash");
  if (!student) return res.status(404).json({ message: "Student not found" });
  res.json(student);
});

router.post("/import", async (req, res) => {
  const rows = z.array(studentSchema).parse(req.body.rows);
  const results = { created: 0, skipped: 0, errors: [] as any[] };
  for (let i = 0; i < rows.length; i++) {
    try {
      const r = rows[i];
      const exists = await User.findOne({ $or: [{ email: r.email.toLowerCase() }, { registerNumber: r.registerNumber }] });
      if (exists) { results.skipped++; continue; }
      const passwordHash = await bcrypt.hash(r.password || r.registerNumber, 12);
      await User.create({ ...r, email: r.email.toLowerCase(), passwordHash, role: "student" });
      results.created++;
    } catch (e: any) {
      results.errors.push({ row: i + 1, message: e.message });
    }
  }
  res.json(results);
});

export default router;
