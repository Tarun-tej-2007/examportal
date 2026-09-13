import mongoose, { Schema } from "mongoose";

/*
  An ExamSpace is the candidate roster for an exam.
  Admins can add/remove students after creation.
  The exam itself is reusable; access is granted only to students in this space.
*/
const examSpaceSchema = new Schema({
  examId: { type: Schema.Types.ObjectId, ref: "Exam", required: true, unique: true },
  name: { type: String, required: true, trim: true },
  studentIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
  active: { type: Boolean, default: true }
}, { timestamps: true });

export const ExamSpace = mongoose.model("ExamSpace", examSpaceSchema);
