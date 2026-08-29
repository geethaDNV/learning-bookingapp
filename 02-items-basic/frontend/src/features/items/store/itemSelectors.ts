import { RootState } from '../../../store/store';

export const selectItemRows = (state: RootState) => state.items.rows;
export const selectSelectedItem = (state: RootState) => state.items.selectedItem;
export const selectItemTotal = (state: RootState) => state.items.total;
export const selectItemPage = (state: RootState) => state.items.page;
export const selectItemPageSize = (state: RootState) => state.items.pageSize;
export const selectItemSearch = (state: RootState) => state.items.search;
export const selectItemStatus = (state: RootState) => state.items.status;
export const selectItemType = (state: RootState) => state.items.itemType;
export const selectItemCode = (state: RootState) => state.items.code;
export const selectItemsLoading = (state: RootState) => state.items.loading;
export const selectItemsSaving = (state: RootState) => state.items.saving;
export const selectItemsError = (state: RootState) => state.items.error;
export const selectItemsSuccessMessage = (state: RootState) => state.items.successMessage;