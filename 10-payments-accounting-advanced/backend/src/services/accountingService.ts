import { Account } from "../../types/index.js";
import { IAccountingService, IAccountRepository } from "../../types/contracts/accounting.js";
import { NotFoundError } from "../../errors/index.js";

export class AccountingService implements IAccountingService {
  constructor(private readonly accountRepository: IAccountRepository) {}

  async getAccount(id: string): Promise<Account> {
    const account = await this.accountRepository.findById(id);
    if (!account) {
      throw new NotFoundError(`Account with ID ${id} not found`);
    }
    return account;
  }

  async getAccountByCode(code: string): Promise<Account> {
    const account = await this.accountRepository.findByCode(code);
    if (!account) {
      throw new NotFoundError(`Account with code ${code} not found`);
    }
    return account;
  }

  async getAllAccounts(): Promise<Account[]> {
    return this.accountRepository.findAll();
  }
}
