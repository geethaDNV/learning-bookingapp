// Customer Create/Edit Page

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { AppDispatch } from '@store/store';
import {
  fetchCustomer,
  createCustomer,
  updateCustomer,
  selectSelectedCustomer,
  selectCustomersLoading,
  selectCustomersError,
  clearSelectedCustomer,
} from '@store/customerSlice';

// Validation schema
const customerSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  gstin: z.string().max(15, 'GSTIN must be 15 characters or less').optional().or(z.literal('')),
  billingAddress: z.string().optional().or(z.literal('')),
});

type CustomerFormData = z.infer<typeof customerSchema>;

export const CustomerFormPage: React.FC = () => {
  const { publicId } = useParams<{ publicId?: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const customer = useSelector(selectSelectedCustomer);
  const loading = useSelector(selectCustomersLoading);
  const error = useSelector(selectCustomersError);
  const isEdit = !!publicId;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
  });

  useEffect(() => {
    if (isEdit && publicId) {
      dispatch(fetchCustomer(publicId));
    }

    return () => {
      dispatch(clearSelectedCustomer());
    };
  }, [publicId, dispatch, isEdit]);

  useEffect(() => {
    if (isEdit && customer) {
      reset({
        displayName: customer.displayName,
        email: customer.email || '',
        phone: customer.phone || '',
        gstin: customer.gstin || '',
        billingAddress: customer.billingAddress || '',
      });
    }
  }, [customer, reset, isEdit]);

  const onSubmit = async (data: CustomerFormData) => {
    try {
      if (isEdit && publicId) {
        await dispatch(
          updateCustomer({
            publicId,
            payload: {
              ...data,
              email: data.email || undefined,
              phone: data.phone || undefined,
              gstin: data.gstin || undefined,
              billingAddress: data.billingAddress || undefined,
            },
          })
        ).unwrap();
      } else {
        await dispatch(createCustomer(data)).unwrap();
      }
      navigate('/customers');
    } catch (err) {
      console.error('Form submission error:', err);
    }
  };

  if (isEdit && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <button
          onClick={() => navigate('/customers')}
          className="mb-6 text-blue-600 hover:text-blue-900"
        >
          ← Back to Customers
        </button>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'Edit Customer' : 'New Customer'}
            </h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
                {error}
              </div>
            )}

            {/* Display Name */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Name *
              </label>
              <input
                {...register('displayName')}
                type="text"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  errors.displayName ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.displayName && (
                <p className="mt-1 text-sm text-red-600">{errors.displayName.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Phone */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                {...register('phone')}
                type="tel"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  errors.phone ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            {/* GSTIN */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GSTIN
              </label>
              <input
                {...register('gstin')}
                type="text"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  errors.gstin ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.gstin && (
                <p className="mt-1 text-sm text-red-600">{errors.gstin.message}</p>
              )}
            </div>

            {/* Billing Address */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Billing Address
              </label>
              <textarea
                {...register('billingAddress')}
                rows={4}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  errors.billingAddress ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.billingAddress && (
                <p className="mt-1 text-sm text-red-600">{errors.billingAddress.message}</p>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : isEdit ? 'Update Customer' : 'Create Customer'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/customers')}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
