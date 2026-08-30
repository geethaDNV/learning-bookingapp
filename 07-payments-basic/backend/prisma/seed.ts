import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.paymentEvent.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoiceLine.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.item.deleteMany();
  await prisma.customer.deleteMany();

  // Create customers
  const customer1 = await prisma.customer.create({
    data: {
      name: "Acme Corporation",
      email: "billing@acme.com",
      phone: "+1-555-0001",
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: "TechStart Inc",
      email: "billing@techstart.com",
      phone: "+1-555-0002",
    },
  });

  // Create items
  const item1 = await prisma.item.create({
    data: {
      name: "Professional Services",
      description: "Consulting and development services",
      unitPrice: 10000, // $100.00 in cents
    },
  });

  const item2 = await prisma.item.create({
    data: {
      name: "Support Package",
      description: "Monthly support subscription",
      unitPrice: 5000, // $50.00 in cents
    },
  });

  // Create invoices with line items
  const invoice1 = await prisma.invoice.create({
    data: {
      number: "INV-2025-001",
      customerId: customer1.id,
      status: "issued",
      subtotal: 15000,
      taxAmount: 1500,
      total: 16500,
      balanceDue: 16500,
      invoiceLines: {
        create: [
          {
            itemId: item1.id,
            quantity: 1,
            unitPrice: 10000,
            lineTotal: 10000,
          },
          {
            itemId: item2.id,
            quantity: 1,
            unitPrice: 5000,
            lineTotal: 5000,
          },
        ],
      },
    },
  });

  const invoice2 = await prisma.invoice.create({
    data: {
      number: "INV-2025-002",
      customerId: customer2.id,
      status: "issued",
      subtotal: 10000,
      taxAmount: 1000,
      total: 11000,
      balanceDue: 11000,
      invoiceLines: {
        create: [
          {
            itemId: item1.id,
            quantity: 1,
            unitPrice: 10000,
            lineTotal: 10000,
          },
        ],
      },
    },
  });

  // Create a partially paid invoice
  const invoice3 = await prisma.invoice.create({
    data: {
      number: "INV-2025-003",
      customerId: customer1.id,
      status: "partially_paid",
      subtotal: 20000,
      taxAmount: 2000,
      total: 22000,
      paidAmount: 10000,
      balanceDue: 12000,
      invoiceLines: {
        create: [
          {
            itemId: item2.id,
            quantity: 4,
            unitPrice: 5000,
            lineTotal: 20000,
          },
        ],
      },
    },
  });

  console.log("✓ Seed completed successfully");
  console.log(`Created ${3} invoices with line items`);
  console.log(`Created ${2} customers`);
  console.log(`Created ${2} items`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
