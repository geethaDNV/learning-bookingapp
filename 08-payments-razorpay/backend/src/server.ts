import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { prisma } from "./db.js";
import { createCradle } from "./di/container.js";
import { createPaymentRoutes } from "./routes/paymentRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import config from "./config.js";

dotenv.config();

const app = express();
const PORT = config.port;

// Middleware
app.use(cors());
app.use(express.json());

// DI Container
const cradle = createCradle(prisma);

// Log provider selection
console.log(
  `Payment provider: ${cradle.gatewayProvider.provider} (configured: ${config.paymentProvider})`
);

// Routes
app.use("/api/v1/payments", createPaymentRoutes(cradle.paymentController));

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    provider: cradle.gatewayProvider.provider,
    timestamp: new Date().toISOString(),
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "Endpoint not found",
    },
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Payment learning server running on http://localhost:${PORT}`);
  console.log(
    `Provider: ${cradle.gatewayProvider.provider}`
  );
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down...");
  await prisma.$disconnect();
  process.exit(0);
});
