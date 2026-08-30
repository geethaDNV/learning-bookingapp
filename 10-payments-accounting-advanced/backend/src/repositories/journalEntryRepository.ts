import prisma from "../../db.js";
import { Payment } from "../../types/index.js";
import { IPaymentRepository } from "../../types/contracts/payments.js";

export class PaymentRepository implements IPaymentRepository {
  async findById(id: string): Promise<Payment | null> {
    return prisma.payment.findUnique({
      where: { id },
    });
  }

  async findByIdempotencyKey(key: string): Promise<Payment | null> {
    return prisma.payment.findUnique({
      where: { idempotencyKey: key },
    });
  }

  async create(
    data: Omit<Payment, "id" | "createdAt" | "updatedAt">
  ): Promise<Payment> {
    return prisma.payment.create({
      data: {
        invoiceId: data.invoiceId,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        paymentGatewayId: data.paymentGatewayId,
        status: data.status,
        capturedAt: data.capturedAt,
        isPosted: data.isPosted,
        idempotencyKey: data.idempotencyKey,
      },
    });
  }

  async update(id: string, data: Partial<Payment>): Promise<Payment> {
    return prisma.payment.update({
      where: { id },
      data,
    });
  }

  async findByInvoiceId(invoiceId: string): Promise<Payment[]> {
    return prisma.payment.findMany({
      where: { invoiceId },
      orderBy: { capturedAt: "desc" },
    });
  }

  async findUnposted(): Promise<Payment[]> {
    return prisma.payment.findMany({
      where: { isPosted: false, status: "captured" },
      orderBy: { capturedAt: "asc" },
    });
  }
}

export class JournalEntryRepository {
  async findById(id: string) {
    return prisma.journalEntry.findUnique({
      where: { id },
      include: { lines: true },
    });
  }

  async create(data: any) {
    return prisma.journalEntry.create({
      data: {
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        description: data.description,
        entryDate: data.entryDate,
        status: data.status,
        lines: {
          create: data.lines,
        },
      },
      include: { lines: true },
    });
  }

  async findByReferenceId(referenceId: string) {
    return prisma.journalEntry.findFirst({
      where: { referenceId },
      include: { lines: true },
    });
  }
}
