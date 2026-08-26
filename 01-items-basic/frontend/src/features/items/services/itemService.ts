import { apiClient } from '../../../services/api/apiClient';
import { Item, ItemListQuery, ItemListResponse } from '../types/item.types';

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
};
