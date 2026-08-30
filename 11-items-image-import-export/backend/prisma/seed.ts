/**
 * Prisma Seed File
 * 
 * Populates the database with sample data for learning and testing.
 * Run with: npm run prisma:seed
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Clear existing data
  await prisma.item.deleteMany({});
  console.log('Cleared existing items');

  // Seed sample items
  const items = [
    {
      name: 'Laptop',
      sku: 'LAPTOP-001',
      itemType: 'GOODS',
      hsnCode: '8471',
      sacCode: null,
      unit: 'PCS',
      salesPrice: 75000,
      isActive: true,
    },
    {
      name: 'Consulting Services',
      sku: 'CONSULT-001',
      itemType: 'SERVICES',
      hsnCode: null,
      sacCode: '998314',
      unit: 'HOUR',
      salesPrice: 2500,
      isActive: true,
    },
    {
      name: 'Office Supplies',
      sku: 'SUPPLIES-001',
      itemType: 'CONSUMABLE',
      hsnCode: '4820',
      sacCode: null,
      unit: 'BOX',
      salesPrice: 350,
      isActive: true,
    },
  ];

  for (const item of items) {
    const created = await prisma.item.create({
      data: item,
    });
    console.log(`Created item: ${created.name}`);
  }

  console.log('Seed completed');
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
