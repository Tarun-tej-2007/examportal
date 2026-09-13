import mongoose, { Schema } from "mongoose";

const userSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["admin", "student"], required: true },
  registerNumber: { type: String, trim: true },
  rollNumber: { type: String, trim: true },
  department: { type: String, trim: true },
  year: { type: String, trim: true },
  section: { type: String, trim: true },
  status: { type: String, enum: ["active", "blocked"], default: "active" }
}, { timestamps: true });

userSchema.index({ registerNumber: 1 }, { sparse: true, unique: true });

export const User = mongoose.model("User", userSchema);
