import { PrismaClient, Payment } from "@prisma/client";
import { PaymentDTO } from "../types/payment.types.js";
import { IPaymentRepository } from "../di/contracts.js";
import { NotFoundError } from "../errors/AppError.js";

export class PaymentRepository implements IPaymentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(
    invoiceId: string,
    customerId: string,
    amount: number,
    publicId: string,
    providerPaymentId: string
  ): Promise<PaymentDTO> {
    const payment = await this.prisma.payment.create({
      data: {
        invoiceId,
        customerId,
        amount,
        publicId,
        providerPaymentId,
        status: "created",
      },
    });

    return this.toDTO(payment);
  }

  async getById(id: string): Promise<PaymentDTO | null> {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    return payment ? this.toDTO(payment) : null;
  }

  async getByPublicId(publicId: string): Promise<PaymentDTO | null> {
    const payment = await this.prisma.payment.findUnique({ where: { publicId } });
    return payment ? this.toDTO(payment) : null;
  }

  async list(filters: {
    page?: number;
    pageSize?: number;
    status?: string;
    invoiceId?: string;
  }): Promise<{ items: PaymentDTO[]; total: number }> {
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.invoiceId) where.invoiceId = filters.invoiceId;

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      items: payments.map((p) => this.toDTO(p)),
      total,
    };
  }

  async updateStatus(id: string, status: string): Promise<PaymentDTO> {
    const payment = await this.prisma.payment.update({
      where: { id },
      data: { status },
    });

    return this.toDTO(payment);
  }

  async updateProviderPaymentId(id: string, providerPaymentId: string): Promise<PaymentDTO> {
    const payment = await this.prisma.payment.update({
      where: { id },
      data: { providerPaymentId },
    });

    return this.toDTO(payment);
  }

  async recordEventId(id: string, eventId: string): Promise<void> {
    await this.prisma.payment.update({
      where: { id },
      data: { lastEventId: eventId },
    });
  }

  async getLastEventId(id: string): Promise<string | null> {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      select: { lastEventId: true },
    });

    return payment?.lastEventId || null;
  }

  private toDTO(payment: Payment): PaymentDTO {
    return {
      id: payment.id,
      publicId: payment.publicId,
      status: payment.status,
      invoiceId: payment.invoiceId,
      customerId: payment.customerId,
      amount: payment.amount,
      providerPaymentId: payment.providerPaymentId,
      providerName: payment.providerName,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }
}
