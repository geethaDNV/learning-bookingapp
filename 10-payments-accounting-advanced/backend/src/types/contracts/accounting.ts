import { Account } from "../types/index.js";

export interface IAccountRepository {
  findById(id: string): Promise<Account | null>;
  findByCode(code: string): Promise<Account | null>;
  findAll(): Promise<Account[]>;
  create(data: Omit<Account, "id" | "createdAt" | "updatedAt">): Promise<Account>;
}

export interface IAccountingService {
  getAccount(id: string): Promise<Account>;
  getAccountByCode(code: string): Promise<Account>;
  getAllAccounts(): Promise<Account[]>;
}
