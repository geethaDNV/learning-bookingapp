import { PrismaClient } from "@prisma/client";
import { IInvoiceNumberService } from "../di/contracts.js";

/**
 * InvoiceNumberService: Generates unique invoice numbers
 * Format: INV-YYYY-NNNN (e.g., INV-2025-0001)
 */
export class InvoiceNumberService implements IInvoiceNumberService {
  constructor(private prisma: PrismaClient) {}

  async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;

    // Find the highest invoice number for this year
    const lastInvoice = await this.prisma.invoice.findMany({
      where: {
        invoiceNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        invoiceNumber: "desc",
      },
      take: 1,
      select: {
        invoiceNumber: true,
      },
    });

    let nextNumber = 1;
    if (lastInvoice.length > 0) {
      const lastNumber = parseInt(
        lastInvoice[0].invoiceNumber.split("-")[2] || "0",
        10
      );
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${String(nextNumber).padStart(4, "0")}`;
  }
}
