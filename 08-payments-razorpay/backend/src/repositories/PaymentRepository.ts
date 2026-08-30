import { PrismaClient } from "@prisma/client";
import { IPaymentRepository } from "../di/contracts.js";
import { PaymentDTO, PaymentProvider } from "../types/payment.types.js";
import { NotFoundError } from "../errors/CustomErrors.js";

export class PaymentRepository implements IPaymentRepository {
  constructor(private prisma: PrismaClient) {}

  async create(
    invoiceId: string,
    customerId: string,
    amount: number,
    currency: string,
    publicId: string,
    providerPaymentId: string,
    providerLinkId: string,
    hostedUrl: string,
    provider: PaymentProvider
  ): Promise<PaymentDTO> {
    const payment = await this.prisma.payment.create({
      data: {
        invoiceId,
        customerId,
        amount,
        currency,
        publicId,
        providerPaymentId,
        providerLinkId,
        hostedUrl,
        provider,
        status: "PENDING",
      },
    });

    return this.mapToDTO(payment);
  }

  async getById(id: string): Promise<PaymentDTO | null> {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
    });
    return payment ? this.mapToDTO(payment) : null;
  }

  async getByPublicId(publicId: string): Promise<PaymentDTO | null> {
    const payment = await this.prisma.payment.findUnique({
      where: { publicId },
    });
    return payment ? this.mapToDTO(payment) : null;
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

    const where: Record<string, unknown> = {};
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
      items: payments.map((p) => this.mapToDTO(p)),
      total,
    };
  }

  async updateStatus(id: string, status: string): Promise<PaymentDTO> {
    const payment = await this.prisma.payment.update({
      where: { id },
      data: {
        status: status as any,
        updatedAt: new Date(),
      },
    });
    return this.mapToDTO(payment);
  }

  async updateProviderPaymentId(
    id: string,
    providerPaymentId: string
  ): Promise<PaymentDTO> {
    const payment = await this.prisma.payment.update({
      where: { id },
      data: {
        providerPaymentId,
        updatedAt: new Date(),
      },
    });
    return this.mapToDTO(payment);
  }

  async recordEventId(id: string, eventId: string): Promise<void> {
    await this.prisma.payment.update({
      where: { id },
      data: {
        lastEventId: eventId,
        updatedAt: new Date(),
      },
    });
  }

  async getLastEventId(id: string): Promise<string | null> {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      select: { lastEventId: true },
    });
    return payment?.lastEventId || null;
  }

  private mapToDTO(payment: any): PaymentDTO {
    return {
      id: payment.id,
      invoiceId: payment.invoiceId,
      customerId: payment.customerId,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      provider: payment.provider,
      publicId: payment.publicId,
      providerPaymentId: payment.providerPaymentId,
      providerLinkId: payment.providerLinkId,
      hostedUrl: payment.hostedUrl,
      lastEventId: payment.lastEventId,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }
}
