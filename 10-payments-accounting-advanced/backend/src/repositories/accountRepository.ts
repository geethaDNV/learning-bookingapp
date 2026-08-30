import prisma from "../../db.js";
import { Account } from "../../types/index.js";
import { IAccountRepository } from "../../types/contracts/accounting.js";
import { NotFoundError } from "../../errors/index.js";

export class AccountRepository implements IAccountRepository {
  async findById(id: string): Promise<Account | null> {
    return prisma.account.findUnique({
      where: { id },
    });
  }

  async findByCode(code: string): Promise<Account | null> {
    return prisma.account.findUnique({
      where: { code },
    });
  }

  async findAll(): Promise<Account[]> {
    return prisma.account.findMany({
      orderBy: { code: "asc" },
    });
  }

  async create(
    data: Omit<Account, "id" | "createdAt" | "updatedAt">
  ): Promise<Account> {
    return prisma.account.create({
      data: {
        code: data.code,
        name: data.name,
        accountType: data.accountType,
        normalBalance: data.normalBalance,
        description: data.description,
      },
    });
  }
}
