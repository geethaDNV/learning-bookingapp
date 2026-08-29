import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  resetFilters,
  setCode,
  setItemType,
  setPage,
  setPageSize,
  setSearch,
  setStatus,
} from '../store/itemSlice';
import {
  selectItemCode,
  selectItemPage,
  selectItemPageSize,
  selectItemRows,
  selectItemSearch,
  selectItemStatus,
  selectItemTotal,
  selectItemType,
  selectItemsError,
  selectItemsLoading,
  selectItemsSaving,
  selectItemsSuccessMessage,
} from '../store/itemSelectors';
import { fetchItems } from '../store/itemThunks';
import { ItemStatusFilter, ItemTypeFilter } from '../types/item.types';

export function useItemsList() {
  const dispatch = useAppDispatch();
  const rows = useAppSelector(selectItemRows);
  const total = useAppSelector(selectItemTotal);
  const page = useAppSelector(selectItemPage);
  const pageSize = useAppSelector(selectItemPageSize);
  const search = useAppSelector(selectItemSearch);
  const status = useAppSelector(selectItemStatus);
  const itemType = useAppSelector(selectItemType);
  const code = useAppSelector(selectItemCode);
  const loading = useAppSelector(selectItemsLoading);
  const saving = useAppSelector(selectItemsSaving);
  const error = useAppSelector(selectItemsError);
  const successMessage = useAppSelector(selectItemsSuccessMessage);

  useEffect(() => {
    dispatch(
      fetchItems({
        search,
        status: status === 'all' ? undefined : status,
        itemType: itemType === 'all' ? undefined : itemType,
        code,
        page,
        pageSize,
      }),
    );
  }, [code, dispatch, itemType, page, pageSize, search, status]);

  return {
    rows,
    total,
    page,
    pageSize,
    search,
    status,
    itemType,
    code,
    loading,
    saving,
    error,
    successMessage,
    setSearch: (value: string) => dispatch(setSearch(value)),
    setStatus: (value: ItemStatusFilter) => dispatch(setStatus(value)),
    setItemType: (value: ItemTypeFilter) => dispatch(setItemType(value)),
    setCode: (value: string) => dispatch(setCode(value)),
    setPage: (value: number) => dispatch(setPage(value)),
    setPageSize: (value: number) => dispatch(setPageSize(value)),
    clearFilters: () => dispatch(resetFilters()),
  };
}