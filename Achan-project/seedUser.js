import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import User from "./models/User.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("Missing MONGO_URI in .env");
  process.exit(1);
}

const email = "kailasgrtvm@gmail.com";
const password = "kailas";

try {
  await mongoose.connect(MONGO_URI);

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    console.log(`User ${email} already exists.`);
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({ email, password: hashedPassword });
  await newUser.save();

  console.log(`Created user ${email}`);
  process.exit(0);
} catch (error) {
  console.error("Failed to create user:", error);
  process.exit(1);
}
