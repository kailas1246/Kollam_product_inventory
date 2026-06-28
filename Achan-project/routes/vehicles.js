import express from "express";
import Vehicle from "../models/Vehicle.js";
import sendExpiryAlert from "../utils/sendExpiryAlert.js";

const router = express.Router();

// Add vehicle
router.post("/", async (req, res) => {
  try {
    const { name, expiry } = req.body;
    const vehicle = await Vehicle.create({ name, expiry });

    const daysLeft = Math.ceil(
      (new Date(expiry) - new Date()) / (1000 * 60 * 60 * 24)
    );
    if (daysLeft <= 10 && daysLeft >= 0) {
      await sendExpiryAlert(vehicle);
    }

    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ error: "Failed to add vehicle" });
  }
});

// Get all vehicles
router.get("/", async (req, res) => {
  const vehicles = await Vehicle.find().sort({ expiry: 1 });
  res.json(vehicles);
});

// DELETE /api/vehicles/:id
router.delete("/:id", async (req, res) => {
  try {
    await Vehicle.findByIdAndDelete(req.params.id);
    res.json({ message: "Vehicle deleted" });
  } catch (err) {
    res.status(500).json({ error: "Error deleting vehicle" });
  }
});

export default router;
