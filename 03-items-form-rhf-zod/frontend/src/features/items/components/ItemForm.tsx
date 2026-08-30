/**
 * ItemForm Component
 * 
 * Reusable form for creating and editing items.
 * Uses React Hook Form with Zod validation.
 * Displays field-level errors and server errors.
 * 
 * Key concepts:
 * - useForm hook from React Hook Form
 * - zodResolver for validation
 * - register for form field binding
 * - formState.errors for field errors
 * - handleSubmit for form submission
 * - Server errors displayed separately
 */

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ItemFormValues, itemFormSchema, defaultFormValues } from '../schemas/itemValidation';
import { ApiError } from '../../../types/index';

interface ItemFormProps {
  onSubmit: (values: ItemFormValues) => void | Promise<void>;
  defaultValues?: ItemFormValues;
  loading?: boolean;
  submitError?: ApiError | null;
}

export function ItemForm({
  onSubmit,
  defaultValues: providedDefaults,
  loading = false,
  submitError,
}: ItemFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: providedDefaults || defaultFormValues,
    mode: 'onBlur',
  });

  const itemType = watch('itemType');
  const showHsnCode = itemType === 'GOODS' || itemType === 'CONSUMABLE';
  const showSacCode = itemType === 'SERVICES';

  // Reset form when defaultValues change (for edit mode)
  React.useEffect(() => {
    if (providedDefaults) {
      reset(providedDefaults);
    }
  }, [providedDefaults, reset]);

  React.useEffect(() => {
    if (showHsnCode) {
      setValue('sacCode', null);
    }

    if (showSacCode) {
      setValue('hsnCode', null);
    }
  }, [setValue, showHsnCode, showSacCode]);

  const isSubmitting_ = isSubmitting || loading;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Server error display */}
      {submitError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-900 font-semibold">{submitError.error}</p>
          <p className="text-red-800">{submitError.message}</p>
          {submitError.details && Object.entries(submitError.details).length > 0 && (
            <ul className="mt-2 space-y-1 text-sm text-red-700">
              {Object.entries(submitError.details).map(([field, messages]: [string, unknown]) => (
                <li key={field}>
                  <strong>{field}:</strong> {Array.isArray(messages) ? messages.join(', ') : String(messages)}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Name field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Name *
        </label>
        <input
          type="text"
          {...register('name')}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter item name"
          disabled={isSubmitting_}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      {/* SKU field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          SKU *
        </label>
        <input
          type="text"
          {...register('sku')}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            errors.sku ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter SKU"
          disabled={isSubmitting_}
        />
        {errors.sku && (
          <p className="mt-1 text-sm text-red-600">{errors.sku.message}</p>
        )}
      </div>

      {/* Item Type field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Item Type *
        </label>
        <select
          {...register('itemType')}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            errors.itemType ? 'border-red-500' : 'border-gray-300'
          }`}
          disabled={isSubmitting_}
        >
          <option value="">Select item type</option>
          <option value="GOODS">Goods</option>
          <option value="SERVICES">Services</option>
          <option value="CONSUMABLE">Consumable</option>
        </select>
        {errors.itemType && (
          <p className="mt-1 text-sm text-red-600">{errors.itemType.message}</p>
        )}
      </div>

      {showHsnCode && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            HSN Code (Optional)
          </label>
          <input
            type="text"
            {...register('hsnCode')}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              errors.hsnCode ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., 8471 for electronics"
            disabled={isSubmitting_}
          />
          {errors.hsnCode && (
            <p className="mt-1 text-sm text-red-600">{errors.hsnCode.message}</p>
          )}
        </div>
      )}

      {showSacCode && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            SAC Code (Optional)
          </label>
          <input
            type="text"
            {...register('sacCode')}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              errors.sacCode ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., 998314 for consulting"
            disabled={isSubmitting_}
          />
          {errors.sacCode && (
            <p className="mt-1 text-sm text-red-600">{errors.sacCode.message}</p>
          )}
        </div>
      )}

      {/* Active checkbox */}
      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            {...register('isActive')}
            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            disabled={isSubmitting_}
          />
          <span className="text-sm font-medium text-gray-700">Active</span>
        </label>
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={isSubmitting_}
        className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 rounded-lg transition"
      >
        {isSubmitting_ ? 'Saving...' : 'Save Item'}
      </button>
    </form>
  );
}
