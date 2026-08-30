import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  fetchInvoices,
  selectInvoiceList,
  selectInvoiceLoading,
  selectInvoiceError,
  clearError,
} from "../store/invoiceSlice.js";
import type { AppDispatch, RootState } from "../store/index.js";
import { InvoiceList } from "../components/InvoiceList.js";

/**
 * InvoiceListPage: Display list of invoices with option to create new
 */
export function InvoiceListPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const invoices = useSelector(selectInvoiceList);
  const isLoading = useSelector(selectInvoiceLoading);
  const error = useSelector(selectInvoiceError);

  useEffect(() => {
    dispatch(fetchInvoices());
  }, [dispatch]);

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <button
            onClick={() => navigate("/invoices/create")}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            + Create Invoice
          </button>
        </div>

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

        {/* Invoice List */}
        <InvoiceList
          invoices={invoices}
          isLoading={isLoading}
          onRowClick={(publicId) => navigate(`/invoices/${publicId}`)}
        />
      </div>
    </div>
  );
}
