import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    remarks: { type: String },
    status: { type: String, enum: ["sold", "not sold"], default: "not sold" },
    provider: { type: String, required: true },
    date: { type: Date, required: true },
  },
  { timestamps: true }
);

const Product =
  mongoose.models.Product || mongoose.model("Product", ProductSchema);

export default Product;
