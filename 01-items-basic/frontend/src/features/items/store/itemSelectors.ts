import type { RootState } from '../../../store/store';

export const selectItemRows = (state: RootState) => state.items.rows;
export const selectItemTotal = (state: RootState) => state.items.total;
export const selectItemPage = (state: RootState) => state.items.page;
export const selectItemPageSize = (state: RootState) => state.items.pageSize;
export const selectItemSearch = (state: RootState) => state.items.search;
export const selectItemStatus = (state: RootState) => state.items.status;
export const selectItemLoading = (state: RootState) => state.items.loading;
export const selectItemError = (state: RootState) => state.items.error;
