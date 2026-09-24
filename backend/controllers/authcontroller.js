import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import Admin from "../models/admin.model.js";
import { sendEmail } from "../utils/mailer.js";

// ==========================================
// ADMIN SIGNUP
// ==========================================
export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email and password",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const existingAdmin = await Admin.findOne();

    if (existingAdmin) {
      return res.status(403).json({
        success: false,
        message: "Admin account already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await Admin.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
    });

    return res.status(201).json({
      success: true,
      message: "Admin account created successfully",
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// ADMIN LOGIN
// ==========================================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    const admin = await Admin.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      admin.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        id: admin._id,
        email: admin.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// ADMIN LOGOUT
// ==========================================
export const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not log out",
    });
  }
};

// ==========================================
// FORGOT PASSWORD
// SEND 6-DIGIT CODE
// ==========================================
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const admin = await Admin.findOne({
      email: email.trim().toLowerCase(),
    });

    // Do not reveal whether the account exists
    if (!admin) {
      return res.status(200).json({
        success: true,
        message:
          "If an account exists with this email, a verification code has been sent",
      });
    }

    // Generate a 6-digit code
    const resetCode = crypto
      .randomInt(100000, 1000000)
      .toString();

    // Hash the code before storing it in the database
    const hashedCode = crypto
      .createHash("sha256")
      .update(resetCode)
      .digest("hex");

    admin.resetPasswordToken = hashedCode;

    admin.resetPasswordExpires = new Date(
      Date.now() + 15 * 60 * 1000
    );

    await admin.save();

    await sendEmail({
      to: admin.email,
      subject:
        "Restaurant Ordering System - Password Reset Code",
      html: `
        <div
          style="
            font-family: Arial, sans-serif;
            line-height: 1.6;
            max-width: 600px;
            margin: auto;
          "
        >
          <h2>Password Reset Request</h2>

          <p>Hello ${admin.name},</p>

          <p>
            We received a request to reset the password
            for your Restaurant Ordering System admin account.
          </p>

          <p>
            Your password reset verification code is:
          </p>

          <div
            style="
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 8px;
              background: #f3f4f6;
              padding: 20px;
              text-align: center;
              border-radius: 8px;
              margin: 20px 0;
            "
          >
            ${resetCode}
          </div>

          <p>
            This code will expire in <strong>15 minutes</strong>.
          </p>

          <p>
            Enter this code on the password reset page
            to create a new password.
          </p>

          <p>
            If you did not request this password reset,
            you can safely ignore this email.
          </p>

          <p>
            Regards,<br />
            Restaurant Ordering System
          </p>
        </div>
      `,
    });

    return res.status(200).json({
      success: true,
      message:
        "Verification code sent successfully",
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// RESET PASSWORD USING CODE
// ==========================================
export const resetPassword = async (req, res) => {
  try {
    const {
      email,
      code,
      password,
    } = req.body;

    if (!email || !code || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Email, verification code and new password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 6 characters",
      });
    }

    const admin = await Admin.findOne({
      email: email.trim().toLowerCase(),
      resetPasswordExpires: {
        $gt: new Date(),
      },
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid or expired verification code",
      });
    }

    // Hash the code entered by the user
    const hashedCode = crypto
      .createHash("sha256")
      .update(code.toString().trim())
      .digest("hex");

    // Compare with the stored hashed code
    if (hashedCode !== admin.resetPasswordToken) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code",
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    admin.password = hashedPassword;

    // Clear reset information
    admin.resetPasswordToken = null;
    admin.resetPasswordExpires = null;

    await admin.save();

    return res.status(200).json({
      success: true,
      message:
        "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};