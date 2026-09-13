import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { config } from "./config";
import { connectDB } from "./db";
import authRoutes from "./routes/auth";
import studentRoutes from "./routes/students";
import questionRoutes from "./routes/questions";
import examRoutes from "./routes/exams";
import attemptRoutes from "./routes/attempts";
import adminRoutes from "./routes/admin";

const app = express();

app.use(helmet());
app.use(cors({ origin: config.frontendUrl }));
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/attempts", attemptRoutes);
app.use("/api/admin", adminRoutes);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  if (err?.name === "ZodError") return res.status(400).json({ message: "Validation error", issues: err.issues });
  res.status(500).json({ message: "Internal server error" });
});

connectDB().then(() => {
  app.listen(config.port, () => console.log(`API running on http://localhost:${config.port}`));
}).catch(err => {
  console.error("Database connection failed", err);
  process.exit(1);
});
