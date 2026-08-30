import "dotenv/config";
import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { createCradle } from "./di/container.js";
import { createInvoiceRoutes } from "./routes/index.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(cors());

// Initialize Prisma
const prisma = new PrismaClient();

// Create DI container
const cradle = createCradle(prisma);

// Routes
app.use("/api/v1", createInvoiceRoutes(cradle));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`✅ Invoice API listening on port ${PORT}`);
  console.log(`📝 POST   /api/v1/invoices - Create invoice`);
  console.log(`📋 GET    /api/v1/invoices - List invoices`);
  console.log(`📖 GET    /api/v1/invoices/:publicId - Get invoice`);
  console.log(`✏️  PUT    /api/v1/invoices/:publicId - Update invoice`);
  console.log(`🔄 PATCH  /api/v1/invoices/:publicId/status - Update status`);
  console.log(
    `🔍 GET    /api/v1/customers/search - Search customers`
  );
  console.log(`🔍 GET    /api/v1/items/search - Search items`);
  console.log(`\n🌐 Health: GET /health`);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully");
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});
