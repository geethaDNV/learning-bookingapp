import { PrismaClient, Decimal } from "@prisma/client";
import { IInvoiceRepository } from "../di/contracts.js";

/**
 * InvoiceRepository: Implements data access for invoices and invoice lines
 */
export class InvoiceRepository implements IInvoiceRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: {
    invoiceNumber: string;
    customerId: number;
    dueDate: Date | null;
    notes: string | null;
    subtotal: Decimal;
    totalTax: Decimal;
    total: Decimal;
    lines: Array<{
      itemId: number;
      quantity: Decimal;
      rate: Decimal;
      taxRate: Decimal;
      lineSubtotal: Decimal;
      lineTax: Decimal;
      lineTotal: Decimal;
    }>;
  }): Promise<{
    id: number;
    publicId: string;
    invoiceNumber: string;
  }> {
    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNumber: data.invoiceNumber,
        customerId: data.customerId,
        dueDate: data.dueDate,
        notes: data.notes,
        subtotal: data.subtotal,
        totalTax: data.totalTax,
        total: data.total,
        lines: {
          create: data.lines.map((line) => ({
            itemId: line.itemId,
            quantity: line.quantity,
            rate: line.rate,
            taxRate: line.taxRate,
            lineSubtotal: line.lineSubtotal,
            lineTax: line.lineTax,
            lineTotal: line.lineTotal,
          })),
        },
      },
      select: {
        id: true,
        publicId: true,
        invoiceNumber: true,
      },
    });

    return invoice;
  }

  async findByPublicId(publicId: string): Promise<any | null> {
    return this.prisma.invoice.findUnique({
      where: { publicId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        lines: {
          include: {
            item: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
    });
  }

  async findById(id: number): Promise<any | null> {
    return this.prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        lines: {
          include: {
            item: true,
          },
        },
      },
    });
  }

  async update(
    id: number,
    data: {
      customerId?: number;
      dueDate?: Date | null;
      notes?: string;
      subtotal: Decimal;
      totalTax: Decimal;
      total: Decimal;
    }
  ): Promise<void> {
    await this.prisma.invoice.update({
      where: { id },
      data: {
        customerId: data.customerId,
        dueDate: data.dueDate,
        notes: data.notes,
        subtotal: data.subtotal,
        totalTax: data.totalTax,
        total: data.total,
      },
    });
  }

  async replaceLines(
    invoiceId: number,
    lines: Array<{
      itemId: number;
      quantity: Decimal;
      rate: Decimal;
      taxRate: Decimal;
      lineSubtotal: Decimal;
      lineTax: Decimal;
      lineTotal: Decimal;
    }>
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Delete existing lines
      await tx.invoiceLine.deleteMany({
        where: { invoiceId },
      });

      // Create new lines
      await tx.invoiceLine.createMany({
        data: lines.map((line) => ({
          invoiceId,
          itemId: line.itemId,
          quantity: line.quantity,
          rate: line.rate,
          taxRate: line.taxRate,
          lineSubtotal: line.lineSubtotal,
          lineTax: line.lineTax,
          lineTotal: line.lineTotal,
        })),
      });
    });
  }

  async updateStatus(id: number, status: string): Promise<void> {
    await this.prisma.invoice.update({
      where: { id },
      data: { status: status as any },
    });
  }

  async list(options: {
    customerId?: number;
    status?: string;
    skip: number;
    take: number;
  }): Promise<Array<any>> {
    return this.prisma.invoice.findMany({
      where: {
        customerId: options.customerId,
        status: options.status as any,
      },
      include: {
        customer: {
          select: {
            name: true,
          },
        },
      },
      skip: options.skip,
      take: options.take,
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async count(options: {
    customerId?: number;
    status?: string;
  }): Promise<number> {
    return this.prisma.invoice.count({
      where: {
        customerId: options.customerId,
        status: options.status as any,
      },
    });
  }
}
