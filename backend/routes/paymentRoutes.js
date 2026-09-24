import express from "express";

import {
    initializePayment,
    verifyPayment,
} from "../controllers/paymentController.js";

const router = express.Router();

// Initialize Flutterwave payment
router.post("/initialize", initializePayment);

// Verify Flutterwave payment
router.get("/verify/:reference", verifyPayment);

export default router;
