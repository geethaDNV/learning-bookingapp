import { apiClient } from '../../../services/api/apiClient';
import { CreateItemPayload, Item, ItemListQuery, ItemListResponse, UpdateItemPayload } from '../types/item.types';

interface ItemApiResponse {
  message: string;
  data: Item;
}

interface MessageApiResponse {
  message: string;
}

interface ItemListApiResponse {
  message: string;
  data: Item[];
  pagination: { total: number; page: number; pageSize: number; totalPages: number };
}

export const itemService = {
  async getItemList(query: ItemListQuery = {}): Promise<ItemListResponse> {
    const response = await apiClient.get<ItemListApiResponse>('/items', {
      search: query.search,
      status: query.status,
      itemType: query.itemType,
      code: query.code,
      page: query.page,
      pageSize: query.pageSize,
    });

    return {
      rows: response.data,
      total: response.pagination.total,
      page: response.pagination.page,
      pageSize: response.pagination.pageSize,
    };
  },

  async getById(id: number): Promise<Item> {
    const response = await apiClient.get<ItemApiResponse>(`/items/${id}`);
    return response.data;
  },

  async create(payload: CreateItemPayload): Promise<Item> {
    const response = await apiClient.post<ItemApiResponse>('/items', payload);
    return response.data;
  },

  async update(id: number, payload: UpdateItemPayload): Promise<Item> {
    const response = await apiClient.put<ItemApiResponse>(`/items/${id}`, payload);
    return response.data;
  },

  async setStatus(id: number, isActive: boolean): Promise<Item> {
    const response = await apiClient.patch<ItemApiResponse>(`/items/${id}/status`, { isActive });
    return response.data;
  },

  async delete(id: number): Promise<string> {
    const response = await apiClient.delete<MessageApiResponse>(`/items/${id}`);
    return response.message;
  },
};