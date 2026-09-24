import express from "express";

import {
  signup,
  login,
  logout,
  forgotPassword,
  resetPassword,
} from "../controllers/authcontroller.js";

import {
  protectAdmin,
} from "../middleware/middleware/authMiddleware.js";

const router = express.Router();

// ==========================================
// ADMIN SIGNUP
// ==========================================
router.post("/signup", signup);

// ==========================================
// ADMIN LOGIN
// ==========================================
router.post("/login", login);

// ==========================================
// ADMIN LOGOUT
// ==========================================
router.post("/logout", logout);

// ==========================================
// FORGOT PASSWORD
// SEND 6-DIGIT VERIFICATION CODE
// ==========================================
router.post(
  "/forgot-password",
  forgotPassword
);

// ==========================================
// RESET PASSWORD
// VERIFY CODE + CHANGE PASSWORD
// ==========================================
router.post(
  "/reset-password",
  resetPassword
);

// ==========================================
// PROTECTED TEST ROUTE
// ==========================================
router.get(
  "/protected",
  protectAdmin,
  (req, res) => {
    res.json({
      success: true,
      message: "You are authorized",
      admin: req.admin,
    });
  }
);

export default router;