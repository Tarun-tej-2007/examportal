import bcrypt from "bcryptjs";
import { connectDB } from "../db";
import { User } from "../models/User";

async function main() {
  await connectDB();
  const email = process.env.ADMIN_EMAIL || "admin@college.edu";
  const password = process.env.ADMIN_PASSWORD || "ChangeMe123!";
  const exists = await User.findOne({ email });
  if (exists) {
    console.log("Admin already exists:", email);
    process.exit(0);
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await User.create({ name: "College Administrator", email, passwordHash, role: "admin" });
  console.log("Admin created:", email);
  process.exit(0);
}
main().catch(err => { console.error(err); process.exit(1); });
