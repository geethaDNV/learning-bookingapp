// Customer Repository - implements ICustomerRepository interface

import { PrismaClient, Customer as PrismaCustomer } from '@prisma/client';
import type {
  ICustomerRepository,
  Customer,
  CreateCustomerPayload,
  UpdateCustomerPayload,
  CustomerListQuery,
  CustomerListResponse,
  CustomerAutocompleteQuery,
  CustomerAutocompleteOption,
} from '@types';

export class CustomerRepository implements ICustomerRepository {
  constructor(private prisma: PrismaClient) {}

  async create(payload: CreateCustomerPayload): Promise<Customer> {
    const customer = await this.prisma.customer.create({
      data: {
        displayName: payload.displayName,
        email: payload.email || null,
        phone: payload.phone || null,
        gstin: payload.gstin || null,
        billingAddress: payload.billingAddress || null,
      },
    });
    return this.mapToDomain(customer);
  }

  async findById(id: number): Promise<Customer | null> {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });
    return customer ? this.mapToDomain(customer) : null;
  }

  async findByPublicId(publicId: string): Promise<Customer | null> {
    const customer = await this.prisma.customer.findUnique({
      where: { publicId },
    });
    return customer ? this.mapToDomain(customer) : null;
  }

  async findByEmail(email: string): Promise<Customer | null> {
    const customer = await this.prisma.customer.findFirst({
      where: { email },
    });
    return customer ? this.mapToDomain(customer) : null;
  }

  async findByGstin(gstin: string): Promise<Customer | null> {
    const customer = await this.prisma.customer.findFirst({
      where: { gstin },
    });
    return customer ? this.mapToDomain(customer) : null;
  }

  async findAll(filters?: { isActive?: boolean }): Promise<Customer[]> {
    const customers = await this.prisma.customer.findMany({
      where: filters?.isActive !== undefined ? { isActive: filters.isActive } : undefined,
      orderBy: { displayName: 'asc' },
    });
    return customers.map(c => this.mapToDomain(c));
  }

  async findPaged(
    filters?: { isActive?: boolean; search?: string },
    options?: { skip?: number; take?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }
  ): Promise<Customer[]> {
    const where: any = {};

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      where.OR = [
        { displayName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
        { gstin: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const sortBy = options?.sortBy || 'createdAt';
    const sortOrder = options?.sortOrder || 'desc';

    const customers = await this.prisma.customer.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: options?.skip,
      take: options?.take,
    });

    return customers.map(c => this.mapToDomain(c));
  }

  async search(query: CustomerListQuery): Promise<CustomerListResponse> {
    const { page = 1, pageSize = 20, search, isActive, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    const where: any = {};
    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    if (search) {
      where.OR = [
        { displayName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { gstin: { contains: search, mode: 'insensitive' } },
      ];
    }

    const total = await this.prisma.customer.count({ where });
    const skip = (page - 1) * pageSize;

    const rows = await this.prisma.customer.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: pageSize,
    });

    return {
      rows: rows.map(c => this.mapToDomain(c)),
      total,
      page,
      pageSize,
    };
  }

  async autocomplete(query: CustomerAutocompleteQuery): Promise<CustomerAutocompleteOption[]> {
    const { search, limit = 10, isActive } = query;

    const where: any = {
      OR: [
        { displayName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { gstin: { contains: search, mode: 'insensitive' } },
      ],
    };

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const customers = await this.prisma.customer.findMany({
      where,
      select: {
        id: true,
        publicId: true,
        displayName: true,
        email: true,
      },
      orderBy: { displayName: 'asc' },
      take: limit,
    });

    return customers;
  }

  async update(publicId: string, payload: UpdateCustomerPayload): Promise<Customer | null> {
    const customer = await this.prisma.customer.update({
      where: { publicId },
      data: {
        ...(payload.displayName !== undefined && { displayName: payload.displayName }),
        ...(payload.email !== undefined && { email: payload.email || null }),
        ...(payload.phone !== undefined && { phone: payload.phone || null }),
        ...(payload.gstin !== undefined && { gstin: payload.gstin || null }),
        ...(payload.billingAddress !== undefined && { billingAddress: payload.billingAddress || null }),
        ...(payload.isActive !== undefined && { isActive: payload.isActive }),
      },
    });
    return this.mapToDomain(customer);
  }

  async setStatus(publicId: string, isActive: boolean): Promise<Customer | null> {
    const customer = await this.prisma.customer.update({
      where: { publicId },
      data: { isActive },
    });
    return this.mapToDomain(customer);
  }

  async count(filters?: { isActive?: boolean; search?: string }): Promise<number> {
    const where: any = {};

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      where.OR = [
        { displayName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
        { gstin: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.customer.count({ where });
  }

  private mapToDomain(customer: PrismaCustomer): Customer {
    return {
      id: customer.id,
      publicId: customer.publicId,
      displayName: customer.displayName,
      email: customer.email,
      phone: customer.phone,
      gstin: customer.gstin,
      billingAddress: customer.billingAddress,
      isActive: customer.isActive,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
      createdBy: customer.createdBy,
      updatedBy: customer.updatedBy,
    };
  }
}
