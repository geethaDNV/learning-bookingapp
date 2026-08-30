import {
  IPaymentReconciliationService,
  IPaymentRepository,
} from "../../types/contracts/payments.js";
import {
  ReconciliationPayload,
  ReconciliationResult,
  Payment,
  ReconciliationRecord,
} from "../../types/index.js";
import { NotFoundError } from "../../errors/index.js";
import prisma from "../../db.js";

export class PaymentReconciliationService
  implements IPaymentReconciliationService
{
  constructor(private readonly paymentRepository: IPaymentRepository) {}

  async markReconciled(
    payload: ReconciliationPayload
  ): Promise<ReconciliationResult> {
    const { paymentId, bankReference, notes } = payload;

    // Verify payment exists
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      throw new NotFoundError(`Payment with ID ${paymentId} not found`);
    }

    // Create or update reconciliation record
    const reconciliationRecord = await prisma.reconciliationRecord.upsert({
      where: { paymentId },
      update: {
        status: "reconciled",
        reconciliationDate: new Date(),
        bankReference: bankReference,
        notes: notes,
      },
      create: {
        paymentId,
        status: "reconciled",
        reconciliationDate: new Date(),
        bankReference: bankReference,
        notes: notes,
      },
    });

    return {
      success: true,
      reconciliationId: reconciliationRecord.id,
      message: "Payment marked as reconciled",
    };
  }

  async getUnreconciledPayments(): Promise<Payment[]> {
    // Get all payments that are captured and not reconciled
    const payments = await prisma.payment.findMany({
      where: {
        status: "captured",
        isPosted: true,
      },
      include: {
        reconciliation: true, // Assuming navigation property exists, adjust as needed
      },
      orderBy: { capturedAt: "asc" },
    });

    // Filter for unreconciled payments
    // We'll use a different approach since Prisma may not have a direct relation
    const reconciliationRecords = await prisma.reconciliationRecord.findMany({
      where: { status: "unreconciled" },
      select: { paymentId: true },
    });

    const unreconciledIds = new Set(
      reconciliationRecords.map((r) => r.paymentId)
    );

    return payments.filter((p) => unreconciledIds.has(p.id));
  }

  async getReconciliationStatus(
    paymentId: string
  ): Promise<ReconciliationRecord | null> {
    return prisma.reconciliationRecord.findUnique({
      where: { paymentId },
    });
  }
}
