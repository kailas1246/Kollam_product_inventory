import IssuedProduct from "../models/IssuedProduct.js";
import Product from "../models/Product.js";

export const deleteIssuedProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await IssuedProduct.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Issued product not found" });
    }

    res.status(200).json({ message: "Issued product deleted successfully" });
  } catch (error) {
    console.error("Error deleting issued product:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getIssuedProducts = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let filter = {};

    if (startDate && endDate) {
      filter.issuedAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate + "T23:59:59.999Z"),
      };
    }

    const products = await IssuedProduct.find(filter).sort({ issuedAt: -1 });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Error fetching issued products", error });
  }
};

export const createIssuedProduct = async (req, res) => {
  try {
    const { productId, name, quantity, unit, issuedTo, remarks, issueDate } =
      req.body;

    if (!productId || !name || !quantity || !unit || !issuedTo || !issueDate) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.quantity < quantity) {
      return res.status(400).json({ message: "Not enough quantity in stock" });
    }

    const issuedProduct = new IssuedProduct({
      productId,
      name,
      quantity,
      unit,
      issuedTo,
      remarks,
      issueDate: new Date(issueDate),
    });
    await issuedProduct.save();

    product.quantity -= quantity;
    await product.save();

    res.status(201).json(issuedProduct);
  } catch (error) {
    console.error("Error issuing product:", error);
    res.status(500).json({ message: "Server error" });
  }
};
