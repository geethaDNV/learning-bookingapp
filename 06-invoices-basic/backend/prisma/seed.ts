import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  await prisma.invoiceLine.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.item.deleteMany();
  await prisma.customer.deleteMany();

  // Create customers
  const acmeCorp = await prisma.customer.create({
    data: {
      name: "ACME Corp",
      email: "contact@acme.com",
      phone: "+1-555-0101",
    },
  });

  const techSolutions = await prisma.customer.create({
    data: {
      name: "Tech Solutions Ltd",
      email: "sales@techsolutions.com",
      phone: "+1-555-0102",
    },
  });

  const globalServices = await prisma.customer.create({
    data: {
      name: "Global Services Inc",
      email: "info@globalservices.com",
      phone: "+1-555-0103",
    },
  });

  // Create items
  const consulting = await prisma.item.create({
    data: {
      name: "Consulting - 1 hour",
      description: "Professional consulting service",
      unitPrice: new Decimal("150.00"),
      taxRate: new Decimal("18"),
    },
  });

  const development = await prisma.item.create({
    data: {
      name: "Software Development - 1 hour",
      description: "Custom software development",
      unitPrice: new Decimal("200.00"),
      taxRate: new Decimal("18"),
    },
  });

  const support = await prisma.item.create({
    data: {
      name: "Technical Support - 1 hour",
      description: "Technical support service",
      unitPrice: new Decimal("100.00"),
      taxRate: new Decimal("18"),
    },
  });

  const training = await prisma.item.create({
    data: {
      name: "Training - 1 hour",
      description: "Training and education",
      unitPrice: new Decimal("120.00"),
      taxRate: new Decimal("18"),
    },
  });

  console.log("✅ Customers created:", [acmeCorp, techSolutions, globalServices]);
  console.log("✅ Items created:", [consulting, development, support, training]);
  console.log("✅ Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
