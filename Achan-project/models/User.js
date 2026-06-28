// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String },
  isBlocked: { type: Boolean, default: false },
});

export default mongoose.model("User", userSchema);
