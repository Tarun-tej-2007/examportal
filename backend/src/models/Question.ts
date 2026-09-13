import mongoose, { Schema } from "mongoose";

const optionSchema = new Schema({
  key: { type: String, required: true },
  text: { type: String, required: true }
}, { _id: false });

const questionSchema = new Schema({
  questionText: { type: String, required: true },
  type: {
    type: String,
    enum: ["single_choice", "multiple_choice", "true_false", "numerical", "short_answer", "descriptive"],
    required: true
  },
  options: { type: [optionSchema], default: [] },
  correctAnswer: { type: Schema.Types.Mixed },
  marks: { type: Number, required: true, min: 0 },
  negativeMarks: { type: Number, default: 0, min: 0 },
  difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
  subject: { type: String, required: true },
  topic: { type: String, default: "" },
  explanation: { type: String, default: "" }
}, { timestamps: true });

questionSchema.index({ subject: 1, topic: 1, difficulty: 1 });

export const Question = mongoose.model("Question", questionSchema);
