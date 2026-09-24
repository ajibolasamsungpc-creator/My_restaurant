import express from "express";

import {
  createOrder,
  getOrders,
  updateOrderStatus,
  getOrderById,
  cancelOrder,
  trackOrder,
} from "../controllers/ordercontroller.js";

import { protectAdmin } from "../middleware/middleware/authMiddleware.js";

const router = express.Router();

// ==========================================
// PUBLIC - GUEST CREATES ORDER
// ==========================================
router.post("/", createOrder);

// ==========================================
// PUBLIC - GUEST TRACKS ORDER
// ==========================================
router.get("/track/:trackingId", trackOrder);

// ==========================================
// ADMIN ONLY - GET ALL ORDERS
// ==========================================
router.get("/", protectAdmin, getOrders);

// ==========================================
// ADMIN ONLY - GET ONE ORDER
// ==========================================
router.get("/:id", protectAdmin, getOrderById);

// ==========================================
// ADMIN ONLY - UPDATE ORDER STATUS
// ==========================================
router.patch(
  "/:id/status",
  protectAdmin,
  updateOrderStatus
);

// ==========================================
// ADMIN ONLY - CANCEL ORDER
// ==========================================
router.patch(
  "/:id/cancel",
  protectAdmin,
  cancelOrder
);

export default router;