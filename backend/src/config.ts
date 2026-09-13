import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/college_exam_portal",
  jwtSecret: process.env.JWT_SECRET || "development-only-secret",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000"
};
