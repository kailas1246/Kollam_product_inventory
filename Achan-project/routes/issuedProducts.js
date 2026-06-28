import express from "express";
import {
  createIssuedProduct,
  getIssuedProducts,
  deleteIssuedProduct,
} from "../controllers/issuedProductController.js";

const router = express.Router();

router.post("/", createIssuedProduct);
router.get("/", getIssuedProducts);
router.delete("/:id", deleteIssuedProduct);

export default router;
