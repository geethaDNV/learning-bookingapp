// Customer Autocomplete Component

import React, { useState, useCallback } from 'react';
import { customerService } from '@services/customerService';
import type { CustomerAutocompleteOption } from '@types';

interface CustomerAutocompleteProps {
  value: CustomerAutocompleteOption | null;
  onSelect: (customer: CustomerAutocompleteOption) => void;
  placeholder?: string;
}

export const CustomerAutocomplete: React.FC<CustomerAutocompleteProps> = ({
  value,
  onSelect,
  placeholder = 'Search customers by name, email, phone, or GSTIN...',
}) => {
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState<CustomerAutocompleteOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Debounced search handler
  const handleSearch = useCallback(async (query: string) => {
    setSearch(query);

    if (!query.trim()) {
      setOptions([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    try {
      const response = await customerService.autocomplete(query, 10);
      if (response.success) {
        setOptions(response.data || []);
        setIsOpen(true);
      }
    } catch (error) {
      console.error('Autocomplete error:', error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelect = (option: CustomerAutocompleteOption) => {
    onSelect(option);
    setSearch('');
    setOptions([]);
    setIsOpen(false);
  };

  const handleClear = () => {
    onSelect(null);
    setSearch('');
    setOptions([]);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={search || (value ? value.displayName : '')}
          onChange={(e) => handleSearch(e.target.value)}
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

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          {loading && (
            <div className="px-3 py-2 text-sm text-gray-500">Searching...</div>
          )}

          {!loading && options.length === 0 && search && (
            <div className="px-3 py-2 text-sm text-gray-500">
              No customers found
            </div>
          )}

          {!loading && options.length > 0 && (
            <ul className="max-h-60 overflow-auto">
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
