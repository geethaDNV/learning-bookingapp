import React, { useState, useCallback } from "react";
import { Controller, FieldValues, Path, Control } from "react-hook-form";
import { SearchApiService } from "../services/api.js";
import type { CustomerOption } from "../types/index.js";

interface CustomerAutocompleteProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  required?: boolean;
  disabled?: boolean;
}

/**
 * CustomerAutocomplete: Search and select customers
 * Uses React Hook Form Controller for integration with form state
 */
export function CustomerAutocomplete<T extends FieldValues>({
  control,
  name,
  label = "Customer",
  required = true,
  disabled = false,
}: CustomerAutocompleteProps<T>) {
  const [options, setOptions] = useState<CustomerOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(
    null
  );

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setOptions([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await SearchApiService.searchCustomers(query);
      setOptions(results);
    } catch (error) {
      console.error("Failed to search customers:", error);
      setOptions([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  return (
    <Controller
      control={control}
      name={name}
      rules={required ? { required: `${label} is required` } : {}}
      render={({ field, fieldState: { error } }) => (
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder={`Search ${label.toLowerCase()}...`}
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
              onFocus={() => setIsOpen(true)}
              onBlur={() => setTimeout(() => setIsOpen(false), 200)}
              onChange={(e) => {
                handleSearch(e.target.value);
              }}
            />

            {isOpen && options.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                {options.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 cursor-pointer"
                    onClick={() => {
                      field.onChange(option.id);
                      setSelectedCustomer(option);
                      setIsOpen(false);
                    }}
                  >
                    <div className="font-medium text-gray-900">
                      {option.name}
                    </div>
                    <div className="text-xs text-gray-500">{option.email}</div>
                  </button>
                ))}
              </div>
            )}

            {isSearching && (
              <div className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-400">
                Loading...
              </div>
            )}
          </div>

          {selectedCustomer && field.value === selectedCustomer.id && (
            <div className="text-sm text-gray-600">
              Selected: <span className="font-medium">{selectedCustomer.name}</span>
            </div>
          )}

          {error && (
            <span className="text-sm text-red-500">{error.message}</span>
          )}
        </div>
      )}
    />
  );
}
