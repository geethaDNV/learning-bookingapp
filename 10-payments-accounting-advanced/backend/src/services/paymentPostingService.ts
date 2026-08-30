import { IPaymentPostingService, IPaymentRepository } from "../../types/contracts/payments.js";
import { PostingPayload, PostingResult, JournalEntry } from "../../types/index.js";
import { ConflictError, NotFoundError, ValidationError } from "../../errors/index.js";
import { JournalEntryRepository } from "../../repositories/journalEntryRepository.js";
import { AccountRepository } from "../../repositories/accountRepository.js";
import prisma from "../../db.js";

export class PaymentPostingService implements IPaymentPostingService {
  constructor(
    private readonly paymentRepository: IPaymentRepository,
    private readonly journalRepository: JournalEntryRepository,
    private readonly accountRepository: AccountRepository
  ) {}

  async postPayment(payload: PostingPayload): Promise<PostingResult> {
    const { paymentId, idempotencyKey } = payload;

    // Fetch the payment
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      throw new NotFoundError(`Payment with ID ${paymentId} not found`);
    }

    // Check if already posted (idempotency check)
    if (payment.isPosted) {
      return {
        success: true,
        paymentId,
        message: "Payment already posted",
      };
    }

    // Check for idempotency key conflict
    if (idempotencyKey) {
      const existing = await this.paymentRepository.findByIdempotencyKey(
        idempotencyKey
      );
      if (existing && existing.id !== paymentId) {
        throw new ConflictError(
          "Idempotency key already used for a different payment"
        );
      }
    }

    // Get accounts for posting
    // Standard posting: Debit Bank/Gateway, Credit Accounts Receivable
    const bankAccount = await this.accountRepository.findByCode("1010");
    const arAccount = await this.accountRepository.findByCode("1200");

    if (!bankAccount || !arAccount) {
      throw new ValidationError("Required accounts (Bank/AR) not found");
    }

    // Create journal entry in transaction
    const journalEntry = await prisma.journalEntry.create({
      data: {
        referenceType: "Payment",
        referenceId: paymentId,
        description: `Payment posting for invoice (Amount: ${payment.amount})`,
        entryDate: new Date(),
        status: "posted",
        lines: {
          create: [
            {
              accountId: bankAccount.id,
              debitAmount: payment.amount,
              creditAmount: 0,
              lineNumber: 1,
              description: "Payment received",
            },
            {
              accountId: arAccount.id,
              debitAmount: 0,
              creditAmount: payment.amount,
              lineNumber: 2,
              description: "Accounts receivable reduction",
            },
          ],
        },
      },
      include: { lines: true },
    });

    // Update payment as posted
    await this.paymentRepository.update(paymentId, {
      isPosted: true,
      postedAt: new Date(),
      idempotencyKey: idempotencyKey,
      status: "captured",
    });

    return {
      success: true,
      paymentId,
      journalEntryId: journalEntry.id,
      message: "Payment posted successfully",
    };
  }

  async isPaymentPosted(paymentId: string): Promise<boolean> {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      throw new NotFoundError(`Payment with ID ${paymentId} not found`);
    }
    return payment.isPosted;
  }
}
