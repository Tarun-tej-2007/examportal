import mongoose, { Schema } from "mongoose";

const integrityLogSchema = new Schema({
  attemptId: { type: Schema.Types.ObjectId, ref: "Attempt", required: true },
  studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  examId: { type: Schema.Types.ObjectId, ref: "Exam", required: true },
  type: {
    type: String,
    enum: ["TAB_SWITCH", "WINDOW_BLUR", "FULLSCREEN_EXIT", "PAGE_HIDDEN", "NAVIGATION", "DUPLICATE_SESSION", "OTHER"],
    required: true
  },
  details: { type: String, default: "" },
  detectedAt: { type: Date, default: Date.now },
  action: { type: String, enum: ["RECORDED", "AUTO_SUBMITTED"], required: true }
}, { timestamps: true });

export const IntegrityLog = mongoose.model("IntegrityLog", integrityLogSchema);
