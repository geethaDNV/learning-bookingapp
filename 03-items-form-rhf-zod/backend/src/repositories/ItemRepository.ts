/**
 * ItemRepository Implementation
 * 
 * Concrete implementation using Prisma as the database abstraction.
 * Implements IItemRepository interface to provide data access methods.
 */

import { PrismaClient, Item } from '@prisma/client';
import { IItemRepository } from './IItemRepository';
import { CreateItemPayload, UpdateItemPayload } from '../types/index';

export class ItemRepository implements IItemRepository {
  constructor(private db: PrismaClient) {}

  async create(payload: CreateItemPayload): Promise<Item> {
    return this.db.item.create({
      data: {
        name: payload.name,
        sku: payload.sku,
        itemType: payload.itemType,
        hsnCode: payload.hsnCode || null,
        sacCode: payload.sacCode || null,
        isActive: payload.isActive !== false, // default to true
      },
    });
  }

  async findById(id: number): Promise<Item | null> {
    return this.db.item.findUnique({
      where: { id },
    });
  }

  async findByName(name: string): Promise<Item | null> {
    return this.db.item.findUnique({
      where: { name },
    });
  }

  async findBySku(sku: string): Promise<Item | null> {
    return this.db.item.findUnique({
      where: { sku },
    });
  }

  async update(id: number, payload: UpdateItemPayload): Promise<Item> {
    const updateData: Record<string, unknown> = {};
    
    if (payload.name !== undefined) updateData.name = payload.name;
    if (payload.sku !== undefined) updateData.sku = payload.sku;
    if (payload.itemType !== undefined) updateData.itemType = payload.itemType;
    if (payload.hsnCode !== undefined) updateData.hsnCode = payload.hsnCode;
    if (payload.sacCode !== undefined) updateData.sacCode = payload.sacCode;
    if (payload.isActive !== undefined) updateData.isActive = payload.isActive;

    return this.db.item.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: number): Promise<boolean> {
    try {
      await this.db.item.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  }

  async list(page: number, pageSize: number): Promise<{ items: Item[]; total: number }> {
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      this.db.item.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.db.item.count(),
    ]);

    return { items, total };
  }
}
