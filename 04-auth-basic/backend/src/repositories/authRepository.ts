import { prisma } from '../db';
import type { IAuthRepository } from '../di/types';

export class AuthRepository implements IAuthRepository {
  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async create(email: string, passwordHash: string, name?: string) {
    return prisma.user.create({
      data: {
        email,
        password: passwordHash,
        name,
      },
    });
  }
}
