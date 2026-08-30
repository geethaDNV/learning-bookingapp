import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create chart of accounts
  const cashAccount = await prisma.account.upsert({
    where: { code: "1010" },
    update: {},
    create: {
      code: "1010",
      name: "Cash/Bank",
      accountType: "Asset",
      normalBalance: "Debit",
      description: "Bank account for receiving payments",
    },
  });

  const arAccount = await prisma.account.upsert({
    where: { code: "1200" },
    update: {},
    create: {
      code: "1200",
      name: "Accounts Receivable",
      accountType: "Asset",
      normalBalance: "Debit",
      description: "Money owed by customers",
    },
  });

  const gatewayClearing = await prisma.account.upsert({
    where: { code: "1220" },
    update: {},
    create: {
      code: "1220",
      name: "Payment Gateway Clearing",
      accountType: "Asset",
      normalBalance: "Debit",
      description: "Temporary account for payment gateway settlements",
    },
  });

  const revenueAccount = await prisma.account.upsert({
    where: { code: "4100" },
    update: {},
    create: {
      code: "4100",
      name: "Sales Revenue",
      accountType: "Revenue",
      normalBalance: "Credit",
      description: "Revenue from invoices",
    },
  });

  const refundExpense = await prisma.account.upsert({
    where: { code: "5100" },
    update: {},
    create: {
      code: "5100",
      name: "Refund Expense",
      accountType: "Expense",
      normalBalance: "Debit",
      description: "Refunds issued to customers",
    },
  });

  console.log("✓ Chart of accounts created");
  console.log("✓ Accounts: Cash, AR, Gateway Clearing, Revenue, Refund Expense");

  // Create a sample invoice
  const invoice = await prisma.invoice.upsert({
    where: { invoiceNumber: "INV-001" },
    update: {},
    create: {
      invoiceNumber: "INV-001",
      customerId: "CUST-001",
      totalAmount: 1000,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: "unpaid",
    },
  });

  console.log("✓ Sample invoice created:", invoice.invoiceNumber);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("✓ Database seeded successfully");
  })
  .catch(async (e) => {
    console.error("Error seeding database:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
