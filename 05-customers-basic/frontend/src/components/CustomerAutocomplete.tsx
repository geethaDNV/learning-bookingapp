// Customer Autocomplete Component — debounced server search with infinite-scroll paging

import React from 'react';
import { useCustomerAutocomplete } from '@hooks/useCustomerAutocomplete';
import type { CustomerAutocompleteOption } from '@types';

const SCROLL_LOAD_MORE_THRESHOLD_PX = 60;

interface CustomerAutocompleteProps {
  value: CustomerAutocompleteOption | null;
  onSelect: (customer: CustomerAutocompleteOption | null) => void;
  placeholder?: string;
}

export const CustomerAutocomplete: React.FC<CustomerAutocompleteProps> = ({
  value,
  onSelect,
  placeholder = 'Search customers by name, email, phone, or GSTIN...',
}) => {
  const { search, setSearch, options, isLoading, isLoadingMore, hasMore, fetchMore, clear } = useCustomerAutocomplete();
  const [isOpen, setIsOpen] = React.useState(false);

  const handleSelect = (option: CustomerAutocompleteOption) => {
    onSelect(option);
    clear();
    setIsOpen(false);
  };

  const handleClear = () => {
    onSelect(null);
    clear();
    setIsOpen(false);
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={search || (value ? value.displayName : '')}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => search && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
        {(search || value) && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      {isOpen && search && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          {isLoading && (
            <div className="px-3 py-2 text-sm text-gray-500">Searching...</div>
          )}

          {!isLoading && options.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-500">
              No customers found
            </div>
          )}

          {!isLoading && options.length > 0 && (
            <ul
              className="max-h-60 overflow-auto"
              onScroll={(e) => {
                const target = e.currentTarget;
                if (hasMore && target.scrollHeight - target.scrollTop - target.clientHeight < SCROLL_LOAD_MORE_THRESHOLD_PX) {
                  fetchMore();
                }
              }}
            >
              {options.map((option) => (
                <li key={option.publicId}>
                  <button
                    onClick={() => handleSelect(option)}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium text-gray-900">
                        {option.displayName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {option.email || 'No email'}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
              {isLoadingMore && (
                <li className="px-3 py-2 text-sm text-gray-500">Loading more...</li>
              )}
            </ul>
          )}
        </div>
      )}

      {value && (
        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm font-medium text-gray-900">{value.displayName}</p>
          {value.email && (
            <p className="text-sm text-gray-500">{value.email}</p>
          )}
        </div>
      )}
    </div>
  );
};
