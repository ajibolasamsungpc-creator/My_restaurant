import jwt from "jsonwebtoken";

export const protectAdmin = (req, res, next) => {
  try {
    // Check Authorization header first
    let token = req.headers.authorization?.split(" ")[1];

    // If there is no Authorization header, check the HTTP-only cookie
    if (!token) {
      token = req.cookies?.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No authentication token provided",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.admin = decoded;

    next();
  } catch (error) {
    console.error("Admin authentication error:", error.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};