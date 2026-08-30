// Customer List Page

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { AppDispatch, RootState } from '@store/store';
import {
  fetchCustomers,
  selectAllCustomers,
  selectCustomersLoading,
  selectCustomersError,
  selectCustomersListMeta,
} from '@store/customerSlice';
import type { CustomerListQuery } from '@types';

export const CustomerListPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const customers = useSelector(selectAllCustomers);
  const loading = useSelector(selectCustomersLoading);
  const error = useSelector(selectCustomersError);
  const meta = useSelector(selectCustomersListMeta);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const query: CustomerListQuery = { page, pageSize: 10, search: search || undefined };
    dispatch(fetchCustomers(query));
  }, [dispatch, page, search]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleCreate = () => {
    navigate('/customers/create');
  };

  const handleEdit = (publicId: string) => {
    navigate(`/customers/${publicId}/edit`);
  };

  const handleView = (publicId: string) => {
    navigate(`/customers/${publicId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <button
            onClick={handleCreate}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            New Customer
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder="Search customers..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm"
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && <div className="text-center py-8 text-gray-500">Loading customers...</div>}

        {/* Customers table */}
        {!loading && customers.length > 0 && (
          <>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customers.map((customer) => (
                    <tr key={customer.publicId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {customer.displayName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {customer.email || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {customer.phone || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            customer.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {customer.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button
                          onClick={() => handleView(customer.publicId)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleEdit(customer.publicId)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Showing {customers.length} of {meta.total} customers
              </p>
              <div className="space-x-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1">{page}</span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page * meta.pageSize >= meta.total}
                  className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}

        {!loading && customers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No customers found</p>
            <button
              onClick={handleCreate}
              className="mt-4 text-blue-600 hover:text-blue-900 font-medium"
            >
              Create your first customer
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
