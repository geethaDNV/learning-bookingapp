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
export type ItemTypeFilter = 'all' | 'goods' | 'service';

export interface ItemListQuery {
  search?: string;
  status?: 'active' | 'inactive';
  itemType?: 'goods' | 'service';
  code?: string;
  page?: number;
  pageSize?: number;
}

export interface ItemListResponse {
  rows: Item[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateItemPayload {
  name: string;
  sku?: string | null;
  itemType: 'goods' | 'service';
  hsnCode?: string | null;
  sacCode?: string | null;
  isActive?: boolean;
}

export interface UpdateItemPayload {
  name?: string;
  sku?: string | null;
  itemType?: 'goods' | 'service';
  hsnCode?: string | null;
  sacCode?: string | null;
  isActive?: boolean;
}

export interface UpdateItemStatusPayload {
  id: number;
  isActive: boolean;
}