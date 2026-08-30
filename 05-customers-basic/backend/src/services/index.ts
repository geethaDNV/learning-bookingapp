// Customer Service - implements ICustomerService interface

import type {
  ICustomerService,
  ICustomerRepository,
  Customer,
  CreateCustomerPayload,
  UpdateCustomerPayload,
  CustomerListQuery,
  CustomerListResponse,
  CustomerAutocompleteQuery,
  CustomerAutocompleteOption,
} from '@types';
import { CUSTOMER_ERROR_MESSAGES } from '@constants';

export class CustomerService implements ICustomerService {
  constructor(private repository: ICustomerRepository) {}

  async create(payload: CreateCustomerPayload): Promise<Customer> {
    // Check for duplicate email if provided
    if (payload.email) {
      const existingByEmail = await this.repository.findByEmail(payload.email);
      if (existingByEmail) {
        throw new Error(CUSTOMER_ERROR_MESSAGES.DUPLICATE_EMAIL);
      }
    }

    // Check for duplicate GSTIN if provided
    if (payload.gstin) {
      const existingByGstin = await this.repository.findByGstin(payload.gstin);
      if (existingByGstin) {
        throw new Error(CUSTOMER_ERROR_MESSAGES.DUPLICATE_GSTIN);
      }
    }

    return this.repository.create(payload);
  }

  async getById(id: number): Promise<Customer | null> {
    return this.repository.findById(id);
  }

  async getByPublicId(publicId: string): Promise<Customer | null> {
    return this.repository.findByPublicId(publicId);
  }

  async listAll(filters?: { isActive?: boolean }): Promise<Customer[]> {
    return this.repository.findAll(filters);
  }

  async search(query: CustomerListQuery): Promise<CustomerListResponse> {
    return this.repository.search(query);
  }

  async autocomplete(query: CustomerAutocompleteQuery): Promise<CustomerAutocompleteOption[]> {
    return this.repository.autocomplete(query);
  }

  async update(publicId: string, payload: UpdateCustomerPayload): Promise<Customer | null> {
    const existing = await this.repository.findByPublicId(publicId);
    if (!existing) {
      throw new Error(CUSTOMER_ERROR_MESSAGES.NOT_FOUND);
    }

    // Check for duplicate email if email is being updated
    if (payload.email && payload.email !== existing.email) {
      const existingByEmail = await this.repository.findByEmail(payload.email);
      if (existingByEmail) {
        throw new Error(CUSTOMER_ERROR_MESSAGES.DUPLICATE_EMAIL);
      }
    }

    // Check for duplicate GSTIN if GSTIN is being updated
    if (payload.gstin && payload.gstin !== existing.gstin) {
      const existingByGstin = await this.repository.findByGstin(payload.gstin);
      if (existingByGstin) {
        throw new Error(CUSTOMER_ERROR_MESSAGES.DUPLICATE_GSTIN);
      }
    }

    return this.repository.update(publicId, payload);
  }

  async setStatus(publicId: string, isActive: boolean): Promise<Customer | null> {
    const existing = await this.repository.findByPublicId(publicId);
    if (!existing) {
      throw new Error(CUSTOMER_ERROR_MESSAGES.NOT_FOUND);
    }

    return this.repository.setStatus(publicId, isActive);
  }
}
