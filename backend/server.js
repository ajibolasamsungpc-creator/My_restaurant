import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

import { connectDB } from "./utils/db.js";

import authRoutes from "./routes/authroutes.js";
import menuRoutes from "./routes/menuRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

const app = express();

const httpServer = createServer(app);

// ==========================================
// PATH SETUP
// ==========================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================
// FRONTEND URL
// ==========================================

const frontendUrl =
  process.env.FRONTEND_URL ||
  "http://localhost:5173";

// ==========================================
// SOCKET.IO
// ==========================================

const io = new Server(httpServer, {
  cors: {
    origin: frontendUrl,
    credentials: true,
  },
});

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(
  cors({
    origin: frontendUrl,
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));

app.use(cookieParser());

// ==========================================
// API ROUTES
// ==========================================

app.use("/auth", authRoutes);

app.use("/menu", menuRoutes);

app.use("/orders", orderRoutes);

app.use("/payments", paymentRoutes);

// ==========================================
// SERVE REACT FRONTEND
// ==========================================

const frontendPath = path.join(
  __dirname,
  "../frontend/dist"
);

app.use(express.static(frontendPath));

// ==========================================
// REACT ROUTING FALLBACK
// ==========================================

app.get(/.*/, (req, res) => {
  res.sendFile(
    path.join(
      frontendPath,
      "index.html"
    )
  );
});

// ==========================================
// SOCKET.IO CONNECTION
// ==========================================

io.on("connection", (socket) => {
  console.log(
    "Client connected:",
    socket.id
  );

  socket.on("disconnect", () => {
    console.log(
      "Client disconnected:",
      socket.id
    );
  });
});

// ==========================================
// START SERVER
// ==========================================

const PORT =
  process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    httpServer.listen(PORT, () => {
      console.log(
        `Server running on http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error(
      `Unable to start server: ${error.message}`
    );

    process.exitCode = 1;
  }
};

startServer();

export { io };