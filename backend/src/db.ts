import mongoose from "mongoose";
import { config } from "./config";

export async function connectDB() {
  await mongoose.connect(config.mongoUri, {
    maxPoolSize: 20,          // allow up to 20 simultaneous DB connections
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });
  console.log("MongoDB connected");
}
