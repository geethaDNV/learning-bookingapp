#!/usr/bin/env node

/**
 * Quick setup and validation script for 08-payments-razorpay
 * Run: npx ts-node setup.ts
 */

import * as fs from "fs";
import * as path from "path";

const REQUIRED_FILES = [
  "backend/package.json",
  "backend/.env.example",
  "backend/tsconfig.json",
  "backend/src/server.ts",
  "backend/prisma/schema.prisma",
  "frontend/package.json",
  "frontend/index.html",
  "frontend/vite.config.ts",
];

console.log("🔍 Checking 08-payments-razorpay module setup...\n");

let allOk = true;

for (const file of REQUIRED_FILES) {
  const filePath = path.join(__dirname, file);
  const exists = fs.existsSync(filePath);
  const icon = exists ? "✅" : "❌";
  console.log(`${icon} ${file}`);
  if (!exists) allOk = false;
}

console.log("\n" + (allOk ? "✅ Setup looks good!" : "❌ Some files are missing"));

if (!allOk) {
  process.exit(1);
}

console.log("\n📝 Next steps:");
console.log("1. Backend: npm install");
console.log("   cp .env.example .env");
console.log("   npx prisma migrate dev");
console.log("   npm run dev");
console.log("\n2. Frontend: npm install");
console.log("   npm run dev");
console.log("\n3. Read docs/ for comprehensive learning material");
