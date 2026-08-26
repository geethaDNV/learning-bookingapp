import { PrismaClient } from '@prisma/client';

// Single shared instance so we don't exhaust Neon's connection pool across hot reloads.
export const prisma = new PrismaClient();
