// Customer Create/Edit Page

import React, { useEffect, useState } from 'react';
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
import { customerService } from '@services/customerService';

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

// Validation schema
const customerSchema = z.object({
  customerType: z.enum(['business', 'individual']),
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  gstin: z.string().regex(GSTIN_REGEX, 'Invalid GSTIN format').optional().or(z.literal('')),
  pan: z.string().regex(PAN_REGEX, 'Invalid PAN format').optional().or(z.literal('')),
  billingAddress: z.string().optional().or(z.literal('')),
}).superRefine((value, context) => {
  if (value.customerType === 'business' && !value.gstin) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['gstin'], message: 'GSTIN is required for a business customer' });
  }
  if (value.customerType === 'individual' && !value.pan) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['pan'], message: 'PAN is required for an individual customer' });
  }
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
    setValue,
    watch,
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: { customerType: 'business', displayName: '', email: '', phone: '', gstin: '', pan: '', billingAddress: '' },
  });
  const [prefillMessage, setPrefillMessage] = useState<string | null>(null);
  const [prefillError, setPrefillError] = useState<string | null>(null);
  const [isPrefillLoading, setIsPrefillLoading] = useState(false);
  const customerType = watch('customerType');
  const gstin = watch('gstin');

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
        customerType: customer.customerType || 'business',
        displayName: customer.displayName,
        email: customer.email || '',
        phone: customer.phone || '',
        gstin: customer.gstin || '',
        pan: customer.pan || '',
        billingAddress: customer.billingAddress || '',
      });
    }
  }, [customer, reset, isEdit]);

  const handleGstinLookup = async () => {
    const normalizedGstin = gstin?.trim().toUpperCase() || '';
    if (!GSTIN_REGEX.test(normalizedGstin)) {
      setPrefillError('Enter a valid 15-character GSTIN before searching.');
      setPrefillMessage(null);
      return;
    }

    setIsPrefillLoading(true);
    setPrefillError(null);
    setPrefillMessage(null);
    try {
      const response = await customerService.getPrefillByGstin(normalizedGstin);
      if (!response.data) {
        setPrefillError('No business details were found for this GSTIN.');
        return;
      }
      setValue('displayName', response.data.displayName, { shouldDirty: true, shouldValidate: true });
      setValue('gstin', response.data.gstin, { shouldDirty: true, shouldValidate: true });
      setValue('billingAddress', response.data.billingAddress, { shouldDirty: true });
      setPrefillMessage('Business details filled from GSTIN.');
    } catch (lookupError) {
      setPrefillError(lookupError instanceof Error ? lookupError.message : 'GSTIN lookup failed.');
    } finally {
      setIsPrefillLoading(false);
    }
  };

  const onSubmit = async (data: CustomerFormData) => {
    try {
      const payload = {
        ...data,
        gstin: data.customerType === 'business' ? data.gstin?.toUpperCase() : undefined,
        pan: data.customerType === 'individual' ? data.pan?.toUpperCase() : undefined,
      };
      if (isEdit && publicId) {
        await dispatch(
          updateCustomer({
            publicId,
            payload: {
              ...payload,
              email: payload.email || undefined,
              phone: payload.phone || undefined,
              billingAddress: payload.billingAddress || undefined,
            },
          })
        ).unwrap();
      } else {
        await dispatch(createCustomer(payload)).unwrap();
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
            <fieldset className="mb-6">
              <legend className="block text-sm font-medium text-gray-700 mb-2">Customer Type *</legend>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input {...register('customerType')} type="radio" value="business" />
                  Business
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input {...register('customerType')} type="radio" value="individual" />
                  Individual
                </label>
              </div>
            </fieldset>

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

            {customerType === 'business' ? (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN *</label>
                <div className="flex gap-3">
                  <input
                    {...register('gstin')}
                    type="text"
                    maxLength={15}
                    className={`min-w-0 flex-1 px-3 py-2 border rounded-md shadow-sm uppercase focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.gstin ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  <button type="button" onClick={handleGstinLookup} disabled={isPrefillLoading} className="shrink-0 px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 disabled:opacity-50">
                    {isPrefillLoading ? 'Searching...' : 'Search GSTIN'}
                  </button>
                </div>
                {errors.gstin && <p className="mt-1 text-sm text-red-600">{errors.gstin.message}</p>}
                {prefillError && <p className="mt-1 text-sm text-red-600">{prefillError}</p>}
                {prefillMessage && <p className="mt-1 text-sm text-green-600">{prefillMessage}</p>}
              </div>
            ) : (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">PAN *</label>
                <input
                  {...register('pan')}
                  type="text"
                  maxLength={10}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm uppercase focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    errors.pan ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.pan && <p className="mt-1 text-sm text-red-600">{errors.pan.message}</p>}
              </div>
            )}

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
