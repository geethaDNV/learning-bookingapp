import { Prisma } from '@prisma/client';
import { prisma } from '../db';

export interface ItemFilters {
  search?: string;
  status?: 'active' | 'inactive';
  itemType?: 'goods' | 'service';
  code?: string;
}

export function toItemWhereInput(filters: ItemFilters): Prisma.ItemWhereInput {
  const andFilters: Prisma.ItemWhereInput[] = [];

  if (filters.search) {
    andFilters.push({
      OR: [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { sku: { contains: filters.search, mode: 'insensitive' } },
        { hsnCode: { contains: filters.search, mode: 'insensitive' } },
        { sacCode: { contains: filters.search, mode: 'insensitive' } },
      ],
    });
  }

  if (filters.code) {
    andFilters.push({
      OR: [
        { hsnCode: { contains: filters.code, mode: 'insensitive' } },
        { sacCode: { contains: filters.code, mode: 'insensitive' } },
      ],
    });
  }

  return {
    ...(filters.status && { isActive: filters.status === 'active' }),
    ...(filters.itemType && { itemType: filters.itemType }),
    ...(andFilters.length > 0 && { AND: andFilters }),
  };
}

export class ItemRepository {
  async findPaged(filters: ItemFilters, page: number, pageSize: number) {
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

  async findById(id: number) {
    return prisma.item.findUnique({ where: { id } });
  }

  async findByName(name: string) {
    return prisma.item.findFirst({ where: { name: { equals: name, mode: 'insensitive' } } });
  }

  async findBySku(sku: string) {
    return prisma.item.findFirst({ where: { sku: { equals: sku, mode: 'insensitive' } } });
  }

  async create(data: Prisma.ItemCreateInput) {
    return prisma.item.create({ data });
  }

  async update(id: number, data: Prisma.ItemUpdateInput) {
    return prisma.item.update({ where: { id }, data });
  }

  async setStatus(id: number, isActive: boolean) {
    return prisma.item.update({ where: { id }, data: { isActive } });
  }

  async delete(id: number) {
    return prisma.item.delete({ where: { id } });
  }
}