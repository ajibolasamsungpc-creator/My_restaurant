import express from "express";

import {
    createMenuItem,
    getMenuItems,
    updateMenuItem,
    deleteMenuItem,
    toggleAvailability,
} from "../controllers/menuController.js";

import { protectAdmin } from "../middleware/middleware/authMiddleware.js";

const router = express.Router();

// Public - anyone can view menu
router.get("/", getMenuItems);

// Admin only - create menu item
router.post("/", protectAdmin, createMenuItem);

// Admin only - update menu item
router.put("/:id", protectAdmin, updateMenuItem);

// Admin only - delete menu item
router.delete("/:id", protectAdmin, deleteMenuItem);

// Admin only - toggle availability
router.patch("/:id/availability", protectAdmin, toggleAvailability);

export default router;