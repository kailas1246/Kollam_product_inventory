import express from "express";
import Product from "../models/Product.js";

const router = express.Router();

// GET all products
router.get("/", async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

// POST add new product
router.post("/", async (req, res) => {
  try {
    const { name, quantity, unit, remarks, status, provider, date } = req.body;

    // Find existing product by name
    const existingProduct = await Product.findOne({ name });

    if (existingProduct) {
      // Add new quantity to old quantity
      existingProduct.quantity =
        Number(existingProduct.quantity) + Number(quantity);

      // Replace remarks with new one
      existingProduct.remarks = remarks;

      // Optionally update provider, status, unit, date
      existingProduct.provider = provider;
      existingProduct.status = status;
      existingProduct.unit = unit;
      existingProduct.date = date;

      await existingProduct.save();
      return res.status(200).json(existingProduct);
    }

    // If product doesn't exist, create new one
    const newProduct = new Product({
      name,
      quantity,
      unit,
      remarks,
      status,
      provider,
      date,
    });

    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to save product" });
  }
});

// POST bulk import
router.post("/import", async (req, res) => {
  try {
    const products = req.body;

    const operations = products.map((item) => ({
      updateOne: {
        filter: { name: item.name, provider: item.provider }, // or `_id` if available
        update: { $set: item },
        upsert: true, // will insert if not found
      },
    }));

    await Product.bulkWrite(operations);

    res
      .status(200)
      .json({ message: "Products imported or updated successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to import products" });
  }
});

// PUT update product
router.put("/:id", async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: "Failed to update product" });
  }
});

// DELETE product
router.delete("/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(400).json({ error: "Failed to delete product" });
  }
});

export default router;
