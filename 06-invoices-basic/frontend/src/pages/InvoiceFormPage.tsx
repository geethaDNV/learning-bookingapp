import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  createInvoice,
  updateInvoice,
  fetchInvoice,
  selectCurrentInvoice,
  selectInvoiceLoading,
  selectInvoiceError,
  clearError,
  clearCurrent,
} from "../store/invoiceSlice.js";
import type { AppDispatch } from "../store/index.js";
import type { InvoiceFormValue } from "../types/index.js";
import { InvoiceForm } from "../components/InvoiceForm.js";

/**
 * InvoiceFormPage: Create or edit invoice
 */
export function InvoiceFormPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { publicId } = useParams<{ publicId?: string }>();

  const currentInvoice = useSelector(selectCurrentInvoice);
  const isLoading = useSelector(selectInvoiceLoading);
  const error = useSelector(selectInvoiceError);

  // Load invoice if editing
  useEffect(() => {
    if (publicId) {
      dispatch(fetchInvoice(publicId));
    } else {
      dispatch(clearCurrent());
    }

    return () => {
      dispatch(clearError());
    };
  }, [publicId, dispatch]);

  const handleSubmit = async (data: InvoiceFormValue) => {
    try {
      if (publicId && currentInvoice) {
        // Update existing
        await dispatch(
          updateInvoice({
            publicId,
            customerId: data.customerId,
            dueDate: data.dueDate || undefined,
            notes: data.notes || undefined,
            lines: data.lines,
          })
        ).unwrap();
        navigate(`/invoices/${publicId}`);
      } else {
        // Create new
        const result = await dispatch(
          createInvoice({
            customerId: data.customerId,
            dueDate: data.dueDate || undefined,
            notes: data.notes || undefined,
            lines: data.lines,
          })
        ).unwrap();
        navigate(`/invoices/${result.publicId}`);
      }
    } catch (err) {
      console.error("Failed to save invoice:", err);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          {publicId ? "Edit Invoice" : "Create New Invoice"}
        </h1>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
            <div className="flex justify-between items-start">
              <span>{error}</span>
              <button
                onClick={() => dispatch(clearError())}
                className="text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        <InvoiceForm
          invoice={currentInvoice}
          isLoading={isLoading}
          onSubmit={handleSubmit}
          onCancel={() => navigate("/invoices")}
        />
      </div>
    </div>
  );
}
