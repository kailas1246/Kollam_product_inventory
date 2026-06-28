import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema({
  name: String,
  expiry: Date,
});

export default mongoose.model("Vehicle", vehicleSchema);
