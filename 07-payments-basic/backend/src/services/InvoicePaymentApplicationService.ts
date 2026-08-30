import { PrismaClient, Invoice } from "@prisma/client";
import { InvoicePaymentInfo } from "../types/payment.types.js";
import { IInvoicePaymentApplicationService } from "../di/contracts.js";
import { NotFoundError } from "../errors/AppError.js";

export class InvoicePaymentApplicationService
  implements IInvoicePaymentApplicationService
{
  constructor(private readonly prisma: PrismaClient) {}

  async applyPaymentToInvoice(invoiceId: string, amount: number): Promise<InvoicePaymentInfo> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new NotFoundError(`Invoice ${invoiceId} not found`);
    }

    const newPaidAmount = invoice.paidAmount + amount;
    const newBalanceDue = Math.max(0, invoice.total - newPaidAmount);
    const newStatus = newBalanceDue === 0 ? "paid" : "partially_paid";

    const updated = await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: newPaidAmount,
        balanceDue: newBalanceDue,
        status: newStatus,
      },
    });

    return this.toPaymentInfo(updated);
  }

  async getInvoicePaymentInfo(invoiceId: string): Promise<InvoicePaymentInfo> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new NotFoundError(`Invoice ${invoiceId} not found`);
    }

    return this.toPaymentInfo(invoice);
  }

  private toPaymentInfo(invoice: Invoice): InvoicePaymentInfo {
    return {
      id: invoice.id,
      number: invoice.number,
      status: invoice.status,
      total: invoice.total,
      paidAmount: invoice.paidAmount,
      balanceDue: invoice.balanceDue,
    };
  }
}
