import { Prisma } from '@prisma/client';
import { prisma } from '../db';

export interface ItemFilters {
  search?: string;
  status?: 'active' | 'inactive';
}

// The core learning point of this module: turning query params into a Prisma `where` clause.
// hsnCode/sacCode are intentionally NOT included here yet — see docs/04-backend-search-filtering.md.
function toItemWhereInput(filters: ItemFilters): Prisma.ItemWhereInput {
  return {
    ...(filters.status && { isActive: filters.status === 'active' }),
    ...(filters.search && {
      OR: [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { sku: { contains: filters.search, mode: 'insensitive' } },
      ],
    }),
  };
}

// Class-based, matching the production repository pattern (constructor-injectable, testable in isolation).
export class ItemRepository {
  async findMany(filters: ItemFilters, page: number, pageSize: number) {
    const where = toItemWhereInput(filters);
    return prisma.item.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  async count(filters: ItemFilters) {
    const where = toItemWhereInput(filters);
    return prisma.item.count({ where });
  }

  async create(data: Prisma.ItemCreateInput) {
    return prisma.item.create({ data });
  }
}
