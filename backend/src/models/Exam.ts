import mongoose, { Schema } from "mongoose";

const examSchema = new Schema({
  title: { type: String, required: true, trim: true },
  subject: { type: String, required: true },
  description: { type: String, default: "" },
  instructions: { type: [String], default: [] },
  durationMinutes: { type: Number, required: true, min: 1 },
  totalMarks: { type: Number, required: true, min: 0 },
  passingMarks: { type: Number, required: true, min: 0 },
  negativeMarking: { type: Boolean, default: false },
  defaultNegativeMarks: { type: Number, default: 0 },
  questionIds: [{ type: Schema.Types.ObjectId, ref: "Question" }],
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  status: { type: String, enum: ["draft", "scheduled", "live", "completed", "archived"], default: "draft" },
  resultMode: { type: String, enum: ["immediate", "manual", "scheduled"], default: "immediate" },
  resultReleaseAt: { type: Date },
  showScore: { type: Boolean, default: true },
  showPassFail: { type: Boolean, default: true },
  showCorrectAnswers: { type: Boolean, default: false },
  showStudentAnswers: { type: Boolean, default: false },
  showExplanations: { type: Boolean, default: false },
  security: {
    requireFullscreen: { type: Boolean, default: true },
    detectTabSwitch: { type: Boolean, default: true },
    detectWindowBlur: { type: Boolean, default: true },
    detectFullscreenExit: { type: Boolean, default: true },
    autoSubmitOnViolation: { type: Boolean, default: true },
    preventMultipleSessions: { type: Boolean, default: true }
  },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

export const Exam = mongoose.model("Exam", examSchema);
