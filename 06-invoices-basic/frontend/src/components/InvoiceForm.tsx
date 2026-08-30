import React, { useMemo } from "react";
import { useForm, useFieldArray, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CustomerAutocomplete } from "./CustomerAutocomplete.js";
import { InvoiceLineFields } from "./InvoiceLineFields.js";
import type { InvoiceFormValue, Invoice } from "../types/index.js";
import { useInvoiceCalculations } from "../hooks/useInvoiceCalculations.js";

/**
 * Validation schema for invoice form
 */
const invoiceFormSchema = z.object({
  customerId: z.number().int().positive("Customer is required"),
  dueDate: z.string().optional().nullable(),
  notes: z.string().optional(),
  lines: z
    .array(
      z.object({
        id: z.number().optional(),
        itemId: z.number().int().positive("Item is required"),
        quantity: z
          .union([z.number(), z.string()])
          .pipe(z.coerce.number().positive("Quantity must be > 0")),
        rate: z
          .union([z.number(), z.string()])
          .pipe(z.coerce.number().nonnegative("Rate must be >= 0")),
      })
    )
    .min(1, "At least one line item is required"),
});

interface InvoiceFormProps {
  invoice?: Invoice | null;
  isLoading?: boolean;
  onSubmit: (data: InvoiceFormValue) => Promise<void>;
  onCancel?: () => void;
}

/**
 * InvoiceForm: Main form component for creating/editing invoices
 * Uses React Hook Form + Zod for validation
 */
export function InvoiceForm({
  invoice,
  isLoading = false,
  onSubmit,
  onCancel,
}: InvoiceFormProps) {
  const form = useForm<InvoiceFormValue>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: invoice
      ? {
          customerId: invoice.customerId,
          dueDate: invoice.dueDate || "",
          notes: invoice.notes || "",
          lines: invoice.lines.map((line) => ({
            id: line.id,
            itemId: line.itemId,
            quantity: Number(line.quantity),
            rate: Number(line.rate),
          })),
        }
      : {
          customerId: 0,
          dueDate: "",
          notes: "",
          lines: [],
        },
  });

  const { control, handleSubmit, watch, formState: { errors } } = form;
  const fieldArray = useFieldArray({ control, name: "lines" });
  const { calculateLine, calculateTotals } = useInvoiceCalculations();

  const lines = watch("lines");

  // Calculate invoice totals in real-time
  const totals = useMemo(() => {
    if (!lines || lines.length === 0) {
      return { subtotal: 0, totalTax: 0, total: 0 };
    }

    const calculations = lines.map((line) => {
      // Note: Tax rate would ideally come from item data
      // For now, we default to 18%
      return calculateLine(line.quantity, line.rate, 18);
    });

    return calculateTotals(calculations);
  }, [lines, calculateLine, calculateTotals]);

  const handleFormSubmit = async (data: InvoiceFormValue) => {
    await onSubmit(data);
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Customer Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">
            Invoice Details
          </h2>
          <div className="space-y-4">
            <CustomerAutocomplete
              control={control}
              name="customerId"
              label="Customer"
              required
              disabled={isLoading}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Due Date
                </label>
                <input
                  type="date"
                  {...form.register("dueDate")}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                {...form.register("notes")}
                disabled={isLoading}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                placeholder="Internal notes or message to customer..."
              />
            </div>
          </div>
        </div>

        {/* Line Items Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <InvoiceLineFields
            control={control}
            fieldArray={fieldArray}
          />
          {errors.lines && (
            <p className="text-red-500 text-sm mt-2">
              {(errors.lines as any).message}
            </p>
          )}
        </div>

        {/* Totals Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="space-y-3 text-right">
            <div className="flex justify-end gap-8">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium w-24">
                ${totals.subtotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-end gap-8">
              <span className="text-gray-600">Tax:</span>
              <span className="font-medium w-24">
                ${totals.totalTax.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-end gap-8 pt-2 border-t-2 border-gray-200">
              <span className="text-lg font-semibold text-gray-900">
                Total:
              </span>
              <span className="text-lg font-semibold w-24 text-blue-600">
                ${totals.total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {isLoading ? "Saving..." : invoice ? "Update Invoice" : "Create Invoice"}
          </button>
        </div>
      </form>
    </FormProvider>
  );
}
