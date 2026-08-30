// Database Seed - Populate with sample customer data

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CustomerSeedData {
  displayName: string;
  email: string;
  phone: string;
  gstin: string;
  billingAddress: string;
}

const sampleCustomers: CustomerSeedData[] = [
  {
    displayName: 'Acme Corporation',
    email: 'contact@acme.com',
    phone: '+91-9876543210',
    gstin: '29AABCT1234H1Z5',
    billingAddress: '123 Business Street, Mumbai, Maharashtra 400001',
  },
  {
    displayName: 'TechStart India Ltd',
    email: 'info@techstart.com',
    phone: '+91-8765432109',
    gstin: '18AABCT5678H1Z0',
    billingAddress: '456 Innovation Park, Bangalore, Karnataka 560001',
  },
  {
    displayName: 'Global Retail Solutions',
    email: 'sales@globalretail.com',
    phone: '+91-7654321098',
    gstin: '27AABCT9012H1Z3',
    billingAddress: '789 Commerce Hub, Delhi, Delhi 110001',
  },
  {
    displayName: 'Premium Services Group',
    email: 'hello@premiumservices.com',
    phone: '+91-6543210987',
    gstin: '06AABCT3456H1Z7',
    billingAddress: '321 Professional Plaza, Pune, Maharashtra 411001',
  },
  {
    displayName: 'Digital Solutions Enterprise',
    email: 'contact@digitalsolutions.com',
    phone: '+91-5432109876',
    gstin: '33AABCT7890H1Z1',
    billingAddress: '654 Tech Park, Hyderabad, Telangana 500001',
  },
  {
    displayName: 'Manufacturing Hub India',
    email: 'procurement@mfghub.com',
    phone: '+91-4321098765',
    gstin: '23AABCT2345H1Z4',
    billingAddress: '987 Industrial Area, Surat, Gujarat 395001',
  },
  {
    displayName: 'Educational Institute Plus',
    email: 'accounts@eduplusi.com',
    phone: '+91-3210987654',
    gstin: '24AABCT6789H1Z8',
    billingAddress: '147 Campus Road, Jaipur, Rajasthan 302001',
  },
  {
    displayName: 'Healthcare Innovations Ltd',
    email: 'billing@healthcareinnovations.com',
    phone: '+91-2109876543',
    gstin: '10AABCT0123H1Z5',
    billingAddress: '258 Medical Center, Chennai, Tamil Nadu 600001',
  },
  {
    displayName: 'Logistics & Supply Chain Co',
    email: 'orders@logisticco.com',
    phone: '+91-1098765432',
    gstin: '19AABCT4567H1Z9',
    billingAddress: '369 Warehouse District, Kolkata, West Bengal 700001',
  },
  {
    displayName: 'Fashion & Retail Trends',
    email: 'wholesale@fashiontrends.com',
    phone: '+91-9000111222',
    gstin: '08AABCT8901H1Z2',
    billingAddress: '741 Fashion Street, Ahmedabad, Gujarat 380001',
  },
];

async function seedDatabase(): Promise<void> {
  try {
    console.log('Clearing existing customers...');
    await prisma.customer.deleteMany();

    console.log('Seeding sample customers...');
    for (const customer of sampleCustomers) {
      await prisma.customer.create({
        data: {
          ...customer,
          isActive: true,
        },
      });
    }

    console.log(`✓ Successfully seeded ${sampleCustomers.length} customers`);
  } catch (error) {
    console.error('Failed to seed database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedDatabase();
