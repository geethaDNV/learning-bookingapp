import { PrismaClient } from "@prisma/client";
import {
  ICustomerLookupRepository,
  IItemLookupRepository,
} from "../di/contracts.js";

/**
 * CustomerLookupRepository: Provides customer search and lookup
 */
export class CustomerLookupRepository implements ICustomerLookupRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: number): Promise<{
    id: number;
    name: string;
    email: string;
  }> {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!customer) {
      throw new Error(`Customer with ID ${id} not found`);
    }

    return customer;
  }

  async search(
    query: string
  ): Promise<
    Array<{
      id: number;
      name: string;
      email: string;
      phone: string | null;
    }>
  > {
    return this.prisma.customer.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
      take: 10,
    });
  }
}

/**
 * ItemLookupRepository: Provides item search and lookup
 */
export class ItemLookupRepository implements IItemLookupRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: number): Promise<{
    id: number;
    name: string;
    description: string | null;
    unitPrice: any;
    taxRate: any;
  }> {
    const item = await this.prisma.item.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        unitPrice: true,
        taxRate: true,
      },
    });

    if (!item) {
      throw new Error(`Item with ID ${id} not found`);
    }

    return item;
  }

  async search(
    query: string
  ): Promise<
    Array<{
      id: number;
      name: string;
      description: string | null;
      unitPrice: any;
      taxRate: any;
    }>
  > {
    return this.prisma.item.findMany({
      where: {
        name: {
          contains: query,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        unitPrice: true,
        taxRate: true,
      },
      take: 10,
    });
  }
}
