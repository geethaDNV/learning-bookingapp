// Customer autocomplete query hook — debounced search, server-paginated infinite scroll (server-only, no client strategy)

import { useCallback, useEffect, useRef, useState } from 'react';
import { customerService } from '@services/customerService';
import type { CustomerAutocompleteOption } from '@types';

const SEARCH_DEBOUNCE_MS = 350;
const DEFAULT_PAGE_SIZE = 10;

export interface UseCustomerAutocompleteResult {
  search: string;
  setSearch: (value: string) => void;
  options: CustomerAutocompleteOption[];
  total: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  fetchMore: () => void;
  clear: () => void;
}

export function useCustomerAutocomplete(pageSize: number = DEFAULT_PAGE_SIZE): UseCustomerAutocompleteResult {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [options, setOptions] = useState<CustomerAutocompleteOption[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const requestIdRef = useRef(0);
  const fetchMoreInFlightRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  // A fresh (debounced) search term always restarts from page 1 and replaces results.
  useEffect(() => {
    const query = debouncedSearch.trim();
    if (!query) {
      setOptions([]);
      setTotal(0);
      setPage(1);
      return;
    }

    const requestId = ++requestIdRef.current;
    setIsLoading(true);

    customerService
      .autocomplete({ search: query, page: 1, limit: pageSize })
      .then((response) => {
        if (requestId !== requestIdRef.current) return;
        setOptions(response.data || []);
        setTotal(response.meta?.total ?? 0);
        setPage(1);
      })
      .catch((error) => {
        if (requestId !== requestIdRef.current) return;
        console.error('Autocomplete error:', error);
        setOptions([]);
        setTotal(0);
      })
      .finally(() => {
        if (requestId === requestIdRef.current) setIsLoading(false);
      });
  }, [debouncedSearch, pageSize]);

  const hasMore = options.length < total;

  // Infinite-scroll page append; guarded against overlapping/stale requests.
  const fetchMore = useCallback(() => {
    const query = debouncedSearch.trim();
    if (!query || !hasMore || isLoading || isLoadingMore || fetchMoreInFlightRef.current) return;

    const requestId = requestIdRef.current;
    const nextPage = page + 1;
    fetchMoreInFlightRef.current = true;
    setIsLoadingMore(true);

    customerService
      .autocomplete({ search: query, page: nextPage, limit: pageSize })
      .then((response) => {
        if (requestId !== requestIdRef.current) return;
        setOptions((prev) => [...prev, ...(response.data || [])]);
        setTotal(response.meta?.total ?? 0);
        setPage(nextPage);
      })
      .catch((error) => {
        if (requestId !== requestIdRef.current) return;
        console.error('Autocomplete error:', error);
      })
      .finally(() => {
        fetchMoreInFlightRef.current = false;
        if (requestId === requestIdRef.current) setIsLoadingMore(false);
      });
  }, [debouncedSearch, hasMore, isLoading, isLoadingMore, page, pageSize]);

  const clear = useCallback(() => {
    requestIdRef.current += 1;
    setSearch('');
    setDebouncedSearch('');
    setOptions([]);
    setTotal(0);
    setPage(1);
  }, []);

  return { search, setSearch, options, total, isLoading, isLoadingMore, hasMore, fetchMore, clear };
}
