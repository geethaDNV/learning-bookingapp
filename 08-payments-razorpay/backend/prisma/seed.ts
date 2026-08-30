import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.payment.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.customer.deleteMany({});

  // Create customers
  const customer1 = await prisma.customer.create({
    data: {
      email: "acme@example.com",
      name: "Acme Corporation",
      phone: "+1-555-0100",
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      email: "techcorp@example.com",
      name: "Tech Corporation",
      phone: "+1-555-0200",
    },
  });

  // Create invoices
  const invoice1 = await prisma.invoice.create({
    data: {
      customerId: customer1.id,
      invoiceNumber: "INV-001",
      amount: 5000.0,
      currency: "INR",
      balanceDue: 5000.0,
      status: "SENT",
      description: "Web Development Services",
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  });

  const invoice2 = await prisma.invoice.create({
    data: {
      customerId: customer2.id,
      invoiceNumber: "INV-002",
      amount: 7500.0,
      currency: "INR",
      balanceDue: 7500.0,
      status: "SENT",
      description: "Mobile App Development",
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  console.log("✅ Seed completed successfully!");
  console.log(`Created ${2} customers and ${2} invoices`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
