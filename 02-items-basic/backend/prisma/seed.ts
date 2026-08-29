import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const items = [
  { name: 'Office Chair', sku: 'FUR-001', itemType: 'goods', hsnCode: '9401', sacCode: null, isActive: true },
  { name: 'Standing Desk', sku: 'FUR-002', itemType: 'goods', hsnCode: '9403', sacCode: null, isActive: true },
  { name: 'Wireless Mouse', sku: 'ELE-010', itemType: 'goods', hsnCode: '8471', sacCode: null, isActive: true },
  { name: 'Mechanical Keyboard', sku: 'ELE-011', itemType: 'goods', hsnCode: '8471', sacCode: null, isActive: true },
  { name: '27-inch Monitor', sku: 'ELE-012', itemType: 'goods', hsnCode: '8528', sacCode: null, isActive: false },
  { name: 'Laptop Stand', sku: 'ELE-013', itemType: 'goods', hsnCode: '8473', sacCode: null, isActive: true },
  { name: 'Consulting Hours', sku: 'SVC-001', itemType: 'service', hsnCode: null, sacCode: '9983', isActive: true },
  { name: 'Website Maintenance', sku: 'SVC-002', itemType: 'service', hsnCode: null, sacCode: '9983', isActive: true },
  { name: 'Onsite Training', sku: 'SVC-003', itemType: 'service', hsnCode: null, sacCode: '9992', isActive: false },
  { name: 'Cloud Hosting Plan', sku: 'SVC-004', itemType: 'service', hsnCode: null, sacCode: '9984', isActive: true },
  { name: 'Ergonomic Footrest', sku: 'FUR-003', itemType: 'goods', hsnCode: '9401', sacCode: null, isActive: true },
  { name: 'Whiteboard Markers', sku: 'STA-001', itemType: 'goods', hsnCode: '9608', sacCode: null, isActive: true },
  { name: 'Notebook Pack', sku: 'STA-002', itemType: 'goods', hsnCode: '4820', sacCode: null, isActive: true },
  { name: 'Filing Cabinet', sku: 'FUR-004', itemType: 'goods', hsnCode: '9403', sacCode: null, isActive: false },
  { name: 'Annual Support Contract', sku: 'SVC-005', itemType: 'service', hsnCode: null, sacCode: '9987', isActive: true },
  { name: 'Desk Lamp', sku: 'ELE-014', itemType: 'goods', hsnCode: '9405', sacCode: null, isActive: true },
  { name: 'External Hard Drive', sku: 'ELE-015', itemType: 'goods', hsnCode: '8471', sacCode: null, isActive: true },
  { name: 'Conference Room Booking', sku: 'SVC-006', itemType: 'service', hsnCode: null, sacCode: '9963', isActive: true },
  { name: 'Installation Service', sku: 'SVC-007', itemType: 'service', hsnCode: null, sacCode: '9954', isActive: true },
  { name: 'Packaging Carton', sku: 'PKG-001', itemType: 'goods', hsnCode: '4819', sacCode: null, isActive: true },
];

async function main() {
  await prisma.item.deleteMany();
  await prisma.item.createMany({ data: items });
  console.log(`Seeded ${items.length} items.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });