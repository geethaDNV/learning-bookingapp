import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  fetchInvoice,
  updateInvoiceStatus,
  selectCurrentInvoice,
  selectInvoiceLoading,
  selectInvoiceError,
  clearError,
} from "../store/invoiceSlice.js";
import type { AppDispatch } from "../store/index.js";

/**
 * InvoiceDetailPage: View invoice details and manage status
 */
export function InvoiceDetailPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { publicId } = useParams<{ publicId: string }>();

  const invoice = useSelector(selectCurrentInvoice);
  const isLoading = useSelector(selectInvoiceLoading);
  const error = useSelector(selectInvoiceError);

  useEffect(() => {
    if (publicId) {
      dispatch(fetchInvoice(publicId));
    }
  }, [publicId, dispatch]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-500">Loading invoice...</div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500">Invoice not found</div>
      </div>
    );
  }

  const handleStatusChange = async (
    newStatus: "DRAFT" | "SENT" | "PAID" | "CANCELLED"
  ) => {
    if (!publicId) return;
    try {
      await dispatch(
        updateInvoiceStatus({
          publicId,
          status: newStatus,
        })
      ).unwrap();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const statusBadgeColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      case "SENT":
        return "bg-blue-100 text-blue-800";
      case "PAID":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header with Actions */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {invoice.invoiceNumber}
            </h1>
            <p className="text-gray-600 mt-1">
              {new Date(invoice.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/invoices")}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Back to List
            </button>
            {invoice.status === "DRAFT" && (
              <button
                onClick={() => navigate(`/invoices/${invoice.publicId}/edit`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Edit
              </button>
            )}
          </div>
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

        {/* Invoice Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Customer Info */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Customer
            </h2>
            <p className="text-gray-900 font-medium">{invoice.customerName}</p>
            {invoice.dueDate && (
              <>
                <p className="text-sm text-gray-600 mt-4">Due Date</p>
                <p className="text-gray-900 font-medium">
                  {new Date(invoice.dueDate).toLocaleDateString()}
                </p>
              </>
            )}
          </div>

          {/* Status */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Status</h2>
            <div className="mb-4">
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusBadgeColor(
                  invoice.status
                )}`}
              >
                {invoice.status}
              </span>
            </div>
            {invoice.status === "DRAFT" && (
              <div className="space-y-2">
                <button
                  onClick={() => handleStatusChange("SENT")}
                  className="w-full px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  disabled={isLoading}
                >
                  Send
                </button>
              </div>
            )}
            {invoice.status === "SENT" && (
              <div className="space-y-2">
                <button
                  onClick={() => handleStatusChange("PAID")}
                  className="w-full px-3 py-2 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                  disabled={isLoading}
                >
                  Mark as Paid
                </button>
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Totals</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">
                  ${Number(invoice.subtotal).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax:</span>
                <span className="font-medium">
                  ${Number(invoice.totalTax).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between pt-3 border-t-2 border-gray-200">
                <span className="font-semibold">Total:</span>
                <span className="font-semibold text-blue-600">
                  ${Number(invoice.total).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Line Items
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Item
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700">
                    Qty
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700">
                    Rate
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700">
                    Subtotal
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700">
                    Tax
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.lines.map((line) => (
                  <tr key={line.id} className="border-b border-gray-200">
                    <td className="px-4 py-3 text-gray-900">
                      {line.itemName}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900">
                      {Number(line.quantity).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900">
                      ${Number(line.rate).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900">
                      ${Number(line.lineSubtotal).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900">
                      ${Number(line.lineTax).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      ${Number(line.lineTotal).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="bg-white p-6 rounded-lg shadow mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
