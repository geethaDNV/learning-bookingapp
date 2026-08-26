import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchItems } from '../store/itemThunks';
import {
  selectItemError,
  selectItemLoading,
  selectItemPage,
  selectItemPageSize,
  selectItemRows,
  selectItemSearch,
  selectItemStatus,
  selectItemTotal,
} from '../store/itemSelectors';
import { resetFilters, setPage, setSearch, setStatus } from '../store/itemSlice';
import { ItemStatusFilter } from '../types/item.types';

// Dispatches fetchItems whenever search/status/page change — mirrors production's dispatch-driven data flow.
export function useItemsList() {
  const dispatch = useAppDispatch();
  const rows = useAppSelector(selectItemRows);
  const total = useAppSelector(selectItemTotal);
  const page = useAppSelector(selectItemPage);
  const pageSize = useAppSelector(selectItemPageSize);
  const search = useAppSelector(selectItemSearch);
  const status = useAppSelector(selectItemStatus);
  const loading = useAppSelector(selectItemLoading);
  const error = useAppSelector(selectItemError);

  useEffect(() => {
    dispatch(
      fetchItems({
        search: search || undefined,
        status: status === 'all' ? undefined : status,
        page,
        pageSize,
      }),
    );
  }, [dispatch, search, status, page, pageSize]);

  return {
    rows,
    total,
    page,
    pageSize,
    search,
    status,
    loading,
    error,
    setSearch: (value: string) => dispatch(setSearch(value)),
    setStatus: (value: ItemStatusFilter) => dispatch(setStatus(value)),
    setPage: (value: number) => dispatch(setPage(value)),
    clearFilters: () => dispatch(resetFilters()),
  };
}
