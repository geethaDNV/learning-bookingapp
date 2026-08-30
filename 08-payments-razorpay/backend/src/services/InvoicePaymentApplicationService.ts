import { PrismaClient } from "@prisma/client";
import { IInvoicePaymentApplicationService } from "../di/contracts.js";
import { InvoicePaymentInfo } from "../types/payment.types.js";
import { NotFoundError } from "../errors/CustomErrors.js";

/**
 * Handles applying captured payments to invoices
 * Updates invoice balance, paid amount, and status
 */
export class InvoicePaymentApplicationService
  implements IInvoicePaymentApplicationService {
  constructor(private prisma: PrismaClient) {}

  async applyPaymentToInvoice(
    invoiceId: string,
    amount: number
  ): Promise<InvoicePaymentInfo> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new NotFoundError(`Invoice not found: ${invoiceId}`);
    }

    // Calculate new payment info
    const newPaidAmount = (invoice.paidAmount || 0) + amount;
    const newBalanceDue = Math.max(0, invoice.amount - newPaidAmount);

    // Determine invoice status
    let status = invoice.status;
    if (newBalanceDue === 0) {
      status = "PAID";
    } else if (newPaidAmount > 0) {
      status = "PARTIALLY_PAID";
    }

    // Update invoice
    const updated = await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: newPaidAmount,
        balanceDue: newBalanceDue,
        status,
        updatedAt: new Date(),
      },
    });

    return {
      invoiceId: updated.id,
      totalAmount: updated.amount,
      paidAmount: updated.paidAmount || 0,
      balanceDue: updated.balanceDue || 0,
      status: updated.status as any,
    };
  }

  async getInvoicePaymentInfo(invoiceId: string): Promise<InvoicePaymentInfo> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new NotFoundError(`Invoice not found: ${invoiceId}`);
    }

    return {
      invoiceId: invoice.id,
      totalAmount: invoice.amount,
      paidAmount: invoice.paidAmount || 0,
      balanceDue: invoice.balanceDue || 0,
      status: invoice.status as any,
    };
  }
}
