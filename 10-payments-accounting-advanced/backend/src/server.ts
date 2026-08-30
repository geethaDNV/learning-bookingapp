import express from "express";
import cors from "cors";
import "dotenv/config.js";
import { createContainer } from "./di/container.js";
import { createRoutes } from "./routes/index.js";
import { errorHandler, asyncHandler } from "./middleware/index.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5174",
    credentials: true,
  })
);

// DI Container
const cradle = createContainer();

// Routes
const routes = createRoutes(cradle);
app.use(routes);

// Error handler (must be last)
app.use(errorHandler);

// Server startup
const server = app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

export default app;
