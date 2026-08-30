import { IPaymentRefundService, IPaymentRepository } from "../../types/contracts/payments.js";
import { RefundPayload, RefundResult, Refund } from "../../types/index.js";
import { NotFoundError, ValidationError } from "../../errors/index.js";
import { JournalEntryRepository } from "../../repositories/journalEntryRepository.js";
import { AccountRepository } from "../../repositories/accountRepository.js";
import prisma from "../../db.js";

export class PaymentRefundService implements IPaymentRefundService {
  constructor(
    private readonly paymentRepository: IPaymentRepository,
    private readonly journalRepository: JournalEntryRepository,
    private readonly accountRepository: AccountRepository
  ) {}

  async refundPayment(payload: RefundPayload): Promise<RefundResult> {
    const { paymentId, amount, reason } = payload;

    // Fetch the payment
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      throw new NotFoundError(`Payment with ID ${paymentId} not found`);
    }

    // Validate refund amount
    if (amount <= 0 || amount > payment.amount) {
      throw new ValidationError(
        `Refund amount must be between 0 and ${payment.amount}`
      );
    }

    // Create refund record
    const refund = await prisma.refund.create({
      data: {
        paymentId,
        amount,
        reason,
        status: "processed",
        processedAt: new Date(),
      },
    });

    // Create reversal journal entry
    const bankAccount = await this.accountRepository.findByCode("1010");
    const refundExpenseAccount = await this.accountRepository.findByCode(
      "5100"
    );

    if (!bankAccount || !refundExpenseAccount) {
      throw new ValidationError(
        "Required accounts (Bank/Refund Expense) not found"
      );
    }

    // Reversal entry: Debit Refund Expense, Credit Bank
    const reversalEntry = await prisma.journalEntry.create({
      data: {
        referenceType: "Refund",
        referenceId: refund.id,
        description: `Refund reversal for payment (Amount: ${amount}, Reason: ${reason})`,
        entryDate: new Date(),
        status: "posted",
        lines: {
          create: [
            {
              accountId: refundExpenseAccount.id,
              debitAmount: amount,
              creditAmount: 0,
              lineNumber: 1,
              description: "Refund expense",
            },
            {
              accountId: bankAccount.id,
              debitAmount: 0,
              creditAmount: amount,
              lineNumber: 2,
              description: "Cash refunded to customer",
            },
          ],
        },
      },
      include: { lines: true },
    });

    // Update payment status
    const newStatus =
      amount === payment.amount ? "refunded" : "partially_refunded";
    await this.paymentRepository.update(paymentId, {
      status: newStatus,
    });

    return {
      success: true,
      refundId: refund.id,
      journalEntryId: reversalEntry.id,
      message: `Refund processed successfully (${newStatus})`,
    };
  }

  async getRefunds(paymentId: string): Promise<Refund[]> {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      throw new NotFoundError(`Payment with ID ${paymentId} not found`);
    }

    return prisma.refund.findMany({
      where: { paymentId },
      orderBy: { createdAt: "desc" },
    });
  }
}
