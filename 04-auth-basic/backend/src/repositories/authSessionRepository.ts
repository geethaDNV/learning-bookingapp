import { prisma } from '../db';

export class AuthSessionRepository {
  async create(userId: string) {
    const session = await prisma.refreshSession.create({
      data: {
        userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });
    return session.id;
  }

  async findById(sessionId: string) {
    return prisma.refreshSession.findUnique({
      where: { id: sessionId },
    });
  }

  async isValid(sessionId: string): Promise<boolean> {
    const session = await this.findById(sessionId);
    if (!session) return false;
    if (session.revokedAt) return false;
    if (session.expiresAt && new Date() > session.expiresAt) return false;
    return true;
  }

  async revoke(sessionId: string) {
    await prisma.refreshSession.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
  }
}
