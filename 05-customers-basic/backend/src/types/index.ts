// Customer Interfaces & Types for DI and service contracts

export interface Customer {
  id: number;
  publicId: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  gstin: string | null;
  billingAddress: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface CreateCustomerPayload {
  displayName: string;
  email?: string;
  phone?: string;
  gstin?: string;
  billingAddress?: string;
}

export interface UpdateCustomerPayload {
  displayName?: string;
  email?: string;
  phone?: string;
  gstin?: string;
  billingAddress?: string;
  isActive?: boolean;
}

export interface CustomerListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: 'displayName' | 'createdAt' | 'email' | 'phone';
  sortOrder?: 'asc' | 'desc';
}

export interface CustomerListResponse {
  rows: Customer[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CustomerAutocompleteQuery {
  search: string;
  limit?: number;
  isActive?: boolean;
}

export interface CustomerAutocompleteOption {
  id: number;
  publicId: string;
  displayName: string;
  email: string | null;
}

// Repository Interface
export interface ICustomerRepository {
  create(payload: CreateCustomerPayload): Promise<Customer>;
  findById(id: number): Promise<Customer | null>;
  findByPublicId(publicId: string): Promise<Customer | null>;
  findByEmail(email: string): Promise<Customer | null>;
  findByGstin(gstin: string): Promise<Customer | null>;
  findAll(filters?: { isActive?: boolean }): Promise<Customer[]>;
  findPaged(
    filters?: { isActive?: boolean; search?: string },
    options?: { skip?: number; take?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }
  ): Promise<Customer[]>;
  search(query: CustomerListQuery): Promise<CustomerListResponse>;
  autocomplete(query: CustomerAutocompleteQuery): Promise<CustomerAutocompleteOption[]>;
  update(publicId: string, payload: UpdateCustomerPayload): Promise<Customer | null>;
  setStatus(publicId: string, isActive: boolean): Promise<Customer | null>;
  count(filters?: { isActive?: boolean; search?: string }): Promise<number>;
}

// Service Interface
export interface ICustomerService {
  create(payload: CreateCustomerPayload): Promise<Customer>;
  getById(id: number): Promise<Customer | null>;
  getByPublicId(publicId: string): Promise<Customer | null>;
  listAll(filters?: { isActive?: boolean }): Promise<Customer[]>;
  search(query: CustomerListQuery): Promise<CustomerListResponse>;
  autocomplete(query: CustomerAutocompleteQuery): Promise<CustomerAutocompleteOption[]>;
  update(publicId: string, payload: UpdateCustomerPayload): Promise<Customer | null>;
  setStatus(publicId: string, isActive: boolean): Promise<Customer | null>;
}

// Controller Interface
export interface ICustomerController {
  getCustomers(req: any, res: any): Promise<void>;
  getCustomer(req: any, res: any): Promise<void>;
  searchCustomers(req: any, res: any): Promise<void>;
  autocompleteCustomers(req: any, res: any): Promise<void>;
  createCustomer(req: any, res: any): Promise<void>;
  updateCustomer(req: any, res: any): Promise<void>;
  setCustomerStatus(req: any, res: any): Promise<void>;
}
