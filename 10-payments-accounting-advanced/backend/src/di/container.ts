import { AccountRepository } from "../repositories/accountRepository.js";
import { PaymentRepository, JournalEntryRepository } from "../repositories/journalEntryRepository.js";
import { AccountingService } from "../services/accountingService.js";
import { PaymentPostingService } from "../services/paymentPostingService.js";
import { PaymentRefundService } from "../services/paymentRefundService.js";
import { PaymentReconciliationService } from "../services/paymentReconciliationService.js";
import { PaymentAccountingService } from "../services/paymentAccountingService.js";

export interface Cradle {
  // Repositories
  accountRepository: AccountRepository;
  paymentRepository: PaymentRepository;
  journalEntryRepository: JournalEntryRepository;

  // Services
  accountingService: AccountingService;
  paymentPostingService: PaymentPostingService;
  paymentRefundService: PaymentRefundService;
  paymentReconciliationService: PaymentReconciliationService;
  paymentAccountingService: PaymentAccountingService;
}

export function createContainer(): Cradle {
  // Repositories
  const accountRepository = new AccountRepository();
  const paymentRepository = new PaymentRepository();
  const journalEntryRepository = new JournalEntryRepository();

  // Services
  const accountingService = new AccountingService(accountRepository);
  const paymentPostingService = new PaymentPostingService(
    paymentRepository,
    journalEntryRepository,
    accountRepository
  );
  const paymentRefundService = new PaymentRefundService(
    paymentRepository,
    journalEntryRepository,
    accountRepository
  );
  const paymentReconciliationService = new PaymentReconciliationService(
    paymentRepository
  );
  const paymentAccountingService = new PaymentAccountingService(
    paymentRepository,
    journalEntryRepository
  );

  return {
    accountRepository,
    paymentRepository,
    journalEntryRepository,
    accountingService,
    paymentPostingService,
    paymentRefundService,
    paymentReconciliationService,
    paymentAccountingService,
  };
}
