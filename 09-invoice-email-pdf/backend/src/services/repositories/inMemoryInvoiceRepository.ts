// In-memory repositories for learning module
// In production, these would be database repositories (Prisma)

import {
  IInvoiceRepository,
  ICustomerRepository,
  Invoice,
  Customer,
} from '@types/index';

/**
 * In-memory invoice repository.
 * Stores invoices in memory for this learning module.
 * 
 * In production: Would query database via Prisma.
 */
export class InMemoryInvoiceRepository implements IInvoiceRepository {
  private invoices: Map<string, Invoice> = new Map();

  constructor() {
    // Add sample data
    this.invoices.set('inv-001', {
      id: 'inv-001',
      invoiceNumber: 'INV-2024-001',
      customerId: 'cust-001',
      amount: 10000,
      dueDate: new Date('2024-09-30'),
      status: 'sent',
      createdAt: new Date(),
    });

    this.invoices.set('inv-002', {
      id: 'inv-002',
      invoiceNumber: 'INV-2024-002',
      customerId: 'cust-002',
      amount: 25000,
      dueDate: new Date('2024-10-15'),
      status: 'sent',
      createdAt: new Date(),
    });
  }

  async findById(id: string): Promise<Invoice | null> {
    return this.invoices.get(id) || null;
  }

  async findByInvoiceNumber(invoiceNumber: string): Promise<Invoice | null> {
    for (const invoice of this.invoices.values()) {
      if (invoice.invoiceNumber === invoiceNumber) {
        return invoice;
      }
    }
    return null;
  }

  /**
   * Helper for testing - add invoice.
   */
  addInvoice(invoice: Invoice): void {
    this.invoices.set(invoice.id, invoice);
  }
}

/**
 * In-memory customer repository.
 * Stores customers in memory for this learning module.
 * 
 * In production: Would query database via Prisma.
 */
export class InMemoryCustomerRepository implements ICustomerRepository {
  private customers: Map<string, Customer> = new Map();

  constructor() {
    // Add sample data
    this.customers.set('cust-001', {
      id: 'cust-001',
      name: 'Acme Corp',
      email: 'billing@acme.com',
      createdAt: new Date(),
    });

    this.customers.set('cust-002', {
      id: 'cust-002',
      name: 'TechStart Inc',
      email: 'accounts@techstart.com',
      createdAt: new Date(),
    });
  }

  async findById(id: string): Promise<Customer | null> {
    return this.customers.get(id) || null;
  }

  /**
   * Helper for testing - add customer.
   */
  addCustomer(customer: Customer): void {
    this.customers.set(customer.id, customer);
  }
}
