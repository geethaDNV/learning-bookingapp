import React from "react";
import {
  FieldValues,
  Path,
  Control,
  UseFieldArrayReturn,
  useFormContext,
} from "react-hook-form";
import { ItemAutocomplete } from "./ItemAutocomplete.js";
import { SearchApiService } from "../services/api.js";
import type { ItemOption, InvoiceLineFormValue } from "../types/index.js";
import { useInvoiceCalculations } from "../hooks/useInvoiceCalculations.js";

interface InvoiceLineFieldsProps<T extends FieldValues> {
  control: Control<T>;
  fieldArray: UseFieldArrayReturn<T, "lines" as any, "id">;
  onLineChange?: (index: number) => void;
}

/**
 * InvoiceLineFields: Dynamic line item rows using useFieldArray
 * Handles adding, removing, and editing invoice lines
 */
export function InvoiceLineFields<T extends FieldValues>({
  control,
  fieldArray,
  onLineChange,
}: InvoiceLineFieldsProps<T>) {
  const { fields, append, remove } = fieldArray;
  const { watch } = useFormContext<T>();
  const { calculateLine } = useInvoiceCalculations();

  const handleAddLine = () => {
    append({
      itemId: 0,
      quantity: 0,
      rate: 0,
    } as any);
  };

  const handleItemSelected = (index: number, item: ItemOption) => {
    const currentLine = watch(`lines.${index}` as any);
    const taxRate = Number(item.taxRate);
    const rate = currentLine.rate || Number(item.unitPrice);
    const calculation = calculateLine(currentLine.quantity, rate, taxRate);

    // Update the form with the rate from the item if not already set
    if (!currentLine.rate) {
      const lineObj = watch("lines" as any);
      lineObj[index].rate = Number(item.unitPrice);
    }

    onLineChange?.(index);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Line Items</h3>
        <button
          type="button"
          onClick={handleAddLine}
          className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
        >
          + Add Line
        </button>
      </div>

      {fields.length === 0 && (
        <div className="p-4 bg-gray-50 rounded-md text-center text-gray-600">
          No line items yet. Click "Add Line" to begin.
        </div>
      )}

      <div className="space-y-4">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="p-4 border border-gray-200 rounded-md bg-white"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 mb-3">
              {/* Item Selection */}
              <div className="lg:col-span-2">
                <ItemAutocomplete
                  control={control}
                  name={`lines.${index}.itemId` as Path<T>}
                  label="Item"
                  required
                  onItemSelected={(item) =>
                    handleItemSelected(index, item)
                  }
                />
              </div>

              {/* Quantity */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Qty <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  {...(control as any).register(`lines.${index}.quantity`, {
                    required: "Qty is required",
                    min: { value: 0, message: "Must be >= 0" },
                  })}
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  onChange={() => onLineChange?.(index)}
                />
              </div>

              {/* Rate */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Rate <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  {...(control as any).register(`lines.${index}.rate`, {
                    required: "Rate is required",
                    min: { value: 0, message: "Must be >= 0" },
                  })}
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  onChange={() => onLineChange?.(index)}
                />
              </div>

              {/* Delete Button */}
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="w-full px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm font-medium"
                >
                  Remove
                </button>
              </div>
            </div>

            {/* Line Totals Preview */}
            <LineTotal index={index} />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Helper component to display line totals
 */
function LineTotal({ index }: { index: number }) {
  const { watch } = useFormContext();
  const { calculateLine } = useInvoiceCalculations();

  const line = watch(`lines.${index}` as any);
  if (!line || !line.itemId || !line.quantity || !line.rate) {
    return null;
  }

  // Note: Tax rate would come from item data in a real scenario
  // For now, we'll use 0% tax in preview
  const calculated = calculateLine(line.quantity, line.rate, 0);

  return (
    <div className="flex justify-end gap-8 text-sm">
      <div>
        <span className="text-gray-600">Subtotal:</span>
        <span className="font-medium ml-2">${calculated.subtotal.toFixed(2)}</span>
      </div>
      <div>
        <span className="text-gray-600">Total:</span>
        <span className="font-medium ml-2">${calculated.total.toFixed(2)}</span>
      </div>
    </div>
  );
}
