export interface Item {
  id: number;
  name: string;
  sku: string | null;
  itemType: 'goods' | 'service';
  hsnCode: string | null;
  sacCode: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ItemStatusFilter = 'all' | 'active' | 'inactive';

export interface ItemListQuery {
  search?: string;
  status?: 'active' | 'inactive';
  page?: number;
  pageSize?: number;
}

export interface ItemListResponse {
  rows: Item[];
  total: number;
  page: number;
  pageSize: number;
}
