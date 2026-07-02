import "dotenv/config";
import express from "express";
import { requestLogger } from "./middlewares/requestLogger";
import { notFoundHandler } from "./middlewares/notFound";
import { errorHandler } from "./middlewares/errorHandler";
import bookingRoutes from "./routes/booking.routes";
import eventRoutes from "./routes/event.routes";
import notificationRoutes from "./routes/notification.routes";
import userRoutes from "./routes/user.routes";

const app = express();

// ─────────────────────────────────────────
// Global Middleware
// ─────────────────────────────────────────
app.use(express.json());
app.use(requestLogger);

// ─────────────────────────────────────────
// Health Check
// ─────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ service: "booking-service", status: "ok" });
});

// ─────────────────────────────────────────
// API Routes
// ─────────────────────────────────────────
app.use("/api/events", eventRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/users", userRoutes);

// ─────────────────────────────────────────
// 404 Handler – must be after all routes
// ─────────────────────────────────────────
app.use(notFoundHandler);

// ─────────────────────────────────────────
// Global Error Handler – must be last
// ─────────────────────────────────────────
app.use(errorHandler);

export default app;
