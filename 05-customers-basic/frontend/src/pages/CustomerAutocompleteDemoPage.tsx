// Demo page for the CustomerAutocomplete component (debounced search + infinite scroll)

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomerAutocomplete } from '@components/CustomerAutocomplete';
import type { CustomerAutocompleteOption } from '@types';

export const CustomerAutocompleteDemoPage: React.FC = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<CustomerAutocompleteOption | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Customer Autocomplete Demo</h1>
          <button
            onClick={() => navigate('/customers')}
            className="text-blue-600 hover:text-blue-800"
          >
            Back to Customers
          </button>
        </div>

        <div className="bg-white p-6 rounded-md shadow">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search for a customer
          </label>
          <CustomerAutocomplete value={selected} onSelect={setSelected} />
        </div>

        {selected && (
          <div className="mt-6 bg-white p-6 rounded-md shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Selected Customer</h2>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <dt className="text-gray-500">Public ID</dt>
              <dd className="text-gray-900">{selected.publicId}</dd>
              <dt className="text-gray-500">Name</dt>
              <dd className="text-gray-900">{selected.displayName}</dd>
              <dt className="text-gray-500">Email</dt>
              <dd className="text-gray-900">{selected.email || '—'}</dd>
            </dl>
          </div>
        )}
      </div>
    </div>
  );
};
