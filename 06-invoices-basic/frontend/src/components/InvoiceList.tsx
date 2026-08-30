import React from "react";
import type { InvoiceListItem } from "../types/index.js";

interface InvoiceListProps {
  invoices: InvoiceListItem[];
  isLoading?: boolean;
  onRowClick?: (publicId: string) => void;
}

/**
 * InvoiceList: Displays a table of invoices
 */
export function InvoiceList({
  invoices,
  isLoading = false,
  onRowClick,
}: InvoiceListProps) {
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading invoices...</div>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="flex justify-center items-center h-64 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-gray-500 mb-2">No invoices found</div>
          <div className="text-sm text-gray-400">Create your first invoice to get started</div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left font-medium text-gray-700">
              Invoice #
            </th>
            <th className="px-6 py-3 text-left font-medium text-gray-700">
              Customer
            </th>
            <th className="px-6 py-3 text-left font-medium text-gray-700">
              Status
            </th>
            <th className="px-6 py-3 text-right font-medium text-gray-700">
              Total
            </th>
            <th className="px-6 py-3 text-left font-medium text-gray-700">
              Date
            </th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr
              key={invoice.publicId}
              onClick={() => onRowClick?.(invoice.publicId)}
              className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition"
            >
              <td className="px-6 py-4 font-medium text-blue-600">
                {invoice.invoiceNumber}
              </td>
              <td className="px-6 py-4 text-gray-900">{invoice.customerName}</td>
              <td className="px-6 py-4">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusBadgeColor(
                    invoice.status
                  )}`}
                >
                  {invoice.status}
                </span>
              </td>
              <td className="px-6 py-4 text-right font-medium text-gray-900">
                ${Number(invoice.total).toFixed(2)}
              </td>
              <td className="px-6 py-4 text-gray-600">
                {new Date(invoice.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
