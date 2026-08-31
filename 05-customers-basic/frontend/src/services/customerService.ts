// Customer API Service

import axios, { AxiosInstance } from 'axios';
import type {
  Customer,
  CreateCustomerPayload,
  UpdateCustomerPayload,
  CustomerListQuery,
  CustomerAutocompleteOption,
  CustomerAutocompleteQuery,
  CustomerGstinPrefill,
  ApiResponse,
} from '@types';

export class CustomerService {
  private api: AxiosInstance;

  constructor(baseURL: string = 'http://localhost:3001/api') {
    this.api = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async listCustomers(query: CustomerListQuery = {}): Promise<ApiResponse<Customer[]>> {
    const response = await this.api.get<ApiResponse<Customer[]>>('/v1/customers', {
      params: query,
    });
    return response.data;
  }

  async getCustomer(publicId: string): Promise<ApiResponse<Customer>> {
    const response = await this.api.get<ApiResponse<Customer>>(`/v1/customers/${publicId}`);
    return response.data;
  }

  async searchCustomers(query: CustomerListQuery): Promise<ApiResponse<Customer[]>> {
    const response = await this.api.get<ApiResponse<Customer[]>>('/v1/customers/search', {
      params: query,
    });
    return response.data;
  }

  async autocomplete(query: CustomerAutocompleteQuery): Promise<ApiResponse<CustomerAutocompleteOption[]>> {
    const response = await this.api.get<ApiResponse<CustomerAutocompleteOption[]>>('/v1/customers/autocomplete', {
      params: { isActive: true, ...query },
    });
    return response.data;
  }

  async getPrefillByGstin(gstin: string): Promise<ApiResponse<CustomerGstinPrefill>> {
    const response = await this.api.get<ApiResponse<CustomerGstinPrefill>>(
      `/v1/customers/prefill/${gstin}`
    );
    return response.data;
  }

  async createCustomer(payload: CreateCustomerPayload): Promise<ApiResponse<Customer>> {
    const response = await this.api.post<ApiResponse<Customer>>('/v1/customers', payload);
    return response.data;
  }

  async updateCustomer(publicId: string, payload: UpdateCustomerPayload): Promise<ApiResponse<Customer>> {
    const response = await this.api.put<ApiResponse<Customer>>(`/v1/customers/${publicId}`, payload);
    return response.data;
  }

  async setCustomerStatus(publicId: string, isActive: boolean): Promise<ApiResponse<Customer>> {
    const response = await this.api.patch<ApiResponse<Customer>>(`/v1/customers/${publicId}/status`, {
      isActive,
    });
    return response.data;
  }
}

// Singleton instance
export const customerService = new CustomerService();
