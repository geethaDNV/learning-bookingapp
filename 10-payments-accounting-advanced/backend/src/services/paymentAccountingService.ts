import { IPaymentAccountingService, IPaymentRepository } from "../../types/contracts/payments.js";
import { AccountingHistory } from "../../types/index.js";
import { NotFoundError } from "../../errors/index.js";
import { JournalEntryRepository } from "../../repositories/journalEntryRepository.js";
import prisma from "../../db.js";

export class PaymentAccountingService implements IPaymentAccountingService {
  constructor(
    private readonly paymentRepository: IPaymentRepository,
    private readonly journalRepository: JournalEntryRepository
  ) {}

  async getPaymentAccountingHistory(paymentId: string): Promise<AccountingHistory> {
    // Fetch the payment
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      throw new NotFoundError(`Payment with ID ${paymentId} not found`);
    }

    // Fetch journal entries for this payment
    const journalEntries = await prisma.journalEntry.findMany({
      where: { referenceId: paymentId },
      include: { lines: true },
      orderBy: { createdAt: "asc" },
    });

    // Fetch refunds for this payment
    const refunds = await prisma.refund.findMany({
      where: { paymentId },
      orderBy: { createdAt: "asc" },
    });

    return {
      paymentId,
      amount: payment.amount,
      status: payment.status,
      isPosted: payment.isPosted,
      journalEntries,
      refunds,
    };
  }
}
