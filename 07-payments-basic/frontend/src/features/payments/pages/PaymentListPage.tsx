import React from "react";
import { useAppDispatch, useAppSelector } from "../../../store";
import {
  selectPayments,
  selectPaymentLoading,
  selectPaymentError,
  selectPaymentPage,
  selectPaymentPageSize,
  selectPaymentTotal,
} from "../store/paymentSelectors";
import { fetchPayments, setPage } from "../store/paymentSlice";

interface PaymentListPageProps {
  invoiceId?: string;
}

export const PaymentListPage: React.FC<PaymentListPageProps> = ({ invoiceId }) => {
  const dispatch = useAppDispatch();
  const payments = useAppSelector(selectPayments);
  const loading = useAppSelector(selectPaymentLoading);
  const error = useAppSelector(selectPaymentError);
  const page = useAppSelector(selectPaymentPage);
  const pageSize = useAppSelector(selectPaymentPageSize);
  const total = useAppSelector(selectPaymentTotal);

  React.useEffect(() => {
    dispatch(fetchPayments({ page, pageSize, invoiceId }));
  }, [page, pageSize, invoiceId, dispatch]);

  if (loading) {
    return <div className="p-8 text-center">Loading payments...</div>;
  }

  if (error) {
    return <div className="p-8 bg-red-50 text-red-700 rounded">{error}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Payments</h1>

      {payments.length === 0 ? (
        <div className="bg-gray-50 rounded p-6 text-center text-gray-600">
          No payments found
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Amount</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Created</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono text-sm">{payment.publicId}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded text-sm font-medium ${
                        payment.status === "captured" ? "bg-green-100 text-green-800" : ""
                      } ${payment.status === "failed" ? "bg-red-100 text-red-800" : ""} ${
                        payment.status === "created" ? "bg-gray-100 text-gray-800" : ""
                      }`}
                    >
                      {payment.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">${(payment.amount / 100).toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(payment.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > pageSize && (
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => dispatch(setPage(Math.max(1, page - 1)))}
            disabled={page === 1}
            className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-center">
            Page {page} of {Math.ceil(total / pageSize)}
          </span>
          <button
            onClick={() => dispatch(setPage(Math.min(Math.ceil(total / pageSize), page + 1)))}
            disabled={page * pageSize >= total}
            className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
