import mongoose, { Schema } from "mongoose";

const answerSchema = new Schema({
  questionId: { type: Schema.Types.ObjectId, ref: "Question", required: true },
  selectedAnswer: { type: Schema.Types.Mixed },
  markedForReview: { type: Boolean, default: false },
  answeredAt: { type: Date }
}, { _id: false });

const snapshotQuestionSchema = new Schema({
  questionId: { type: Schema.Types.ObjectId, required: true },
  questionText: String,
  type: String,
  options: { type: [Schema.Types.Mixed], default: [] },
  marks: Number,
  negativeMarks: Number,
  correctAnswer: Schema.Types.Mixed
}, { _id: false });

const attemptSchema = new Schema({
  examId: { type: Schema.Types.ObjectId, ref: "Exam", required: true },
  studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["in_progress", "submitted", "auto_submitted"], default: "in_progress" },
  startedAt: { type: Date, required: true },
  submittedAt: Date,
  serverDeadline: { type: Date, required: true },
  answers: { type: [answerSchema], default: [] },
  questionSnapshot: { type: [snapshotQuestionSchema], default: [] },
  score: { type: Number, default: 0 },
  objectiveScore: { type: Number, default: 0 },
  manualScore: { type: Number, default: 0 },
  correctAnswers: { type: Number, default: 0 },
  incorrectAnswers: { type: Number, default: 0 },
  unanswered: { type: Number, default: 0 },
  timeTakenSeconds: { type: Number, default: 0 },
  violationCount: { type: Number, default: 0 }
}, { timestamps: true });

attemptSchema.index({ examId: 1, studentId: 1 }, { unique: true });

export const Attempt = mongoose.model("Attempt", attemptSchema);
