// Customer Detail Page

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import type { AppDispatch, RootState } from '@store/store';
import { fetchCustomer, selectSelectedCustomer, selectCustomersLoading } from '@store/customerSlice';

export const CustomerDetailPage: React.FC = () => {
  const { publicId } = useParams<{ publicId: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const customer = useSelector(selectSelectedCustomer);
  const loading = useSelector(selectCustomersLoading);

  useEffect(() => {
    if (publicId) {
      dispatch(fetchCustomer(publicId));
    }
  }, [publicId, dispatch]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Customer not found</p>
          <button
            onClick={() => navigate('/customers')}
            className="text-blue-600 hover:text-blue-900"
          >
            Back to Customers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <button
          onClick={() => navigate('/customers')}
          className="mb-6 text-blue-600 hover:text-blue-900"
        >
          ← Back to Customers
        </button>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">{customer.displayName}</h1>
            <div className="space-x-2">
              <button
                onClick={() => navigate(`/customers/${customer.publicId}/edit`)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Edit
              </button>
            </div>
          </div>

          <div className="px-6 py-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Contact Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="text-gray-900">{customer.email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="text-gray-900">{customer.phone || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Business Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Business Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">GSTIN</p>
                    <p className="text-gray-900">{customer.gstin || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          customer.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {customer.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Billing Address */}
            {customer.billingAddress && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Billing Address
                </h3>
                <p className="text-gray-600 whitespace-pre-wrap">{customer.billingAddress}</p>
              </div>
            )}

            {/* Metadata */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Metadata</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Created</p>
                  <p className="text-gray-900">
                    {new Date(customer.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Last Updated</p>
                  <p className="text-gray-900">
                    {new Date(customer.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
