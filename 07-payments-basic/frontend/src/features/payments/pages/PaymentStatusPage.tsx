import React from "react";
import { useAppDispatch, useAppSelector } from "../../../store";
import {
  selectSelectedPayment,
  selectPaymentLoading,
  selectPaymentError,
} from "../store/paymentSelectors";
import {
  fetchPaymentStatus,
  simulatePaymentSuccess,
  simulatePaymentFailure,
  clearSelectedPayment,
  clearError,
} from "../store/paymentSlice";

interface PaymentStatusPageProps {
  publicId: string;
}

export const PaymentStatusPage: React.FC<PaymentStatusPageProps> = ({ publicId }) => {
  const dispatch = useAppDispatch();
  const status = useAppSelector(selectSelectedPayment);
  const loading = useAppSelector(selectPaymentLoading);
  const error = useAppSelector(selectPaymentError);

  React.useEffect(() => {
    dispatch(fetchPaymentStatus(publicId));
  }, [publicId, dispatch]);

  const handleSimulateSuccess = () => {
    if (status) {
      dispatch(simulatePaymentSuccess(status.id));
    }
  };

  const handleSimulateFailure = () => {
    if (status) {
      dispatch(simulatePaymentFailure(status.id));
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading payment status...</div>;
  }

  if (error) {
    return <div className="p-8 bg-red-50 text-red-700 rounded">{error}</div>;
  }

  if (!status) {
    return <div className="p-8 text-center">Payment not found</div>;
  }

  const statusColor = {
    created: "bg-gray-100 text-gray-800",
    pending: "bg-blue-100 text-blue-800",
    captured: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    cancelled: "bg-yellow-100 text-yellow-800",
  }[status.status as keyof typeof statusColor] || "bg-gray-100";

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Payment Status</h1>

      <div className="bg-white rounded-lg shadow p-6 space-y-4 mb-6">
        <div>
          <label className="text-sm font-medium text-gray-600">Public ID</label>
          <p className="text-lg font-mono">{status.publicId}</p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600">Status</label>
          <p className={`inline-block px-3 py-1 rounded ${statusColor} font-semibold`}>
            {status.status.toUpperCase()}
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600">Amount</label>
          <p className="text-lg">${(status.amount / 100).toFixed(2)}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Paid Amount</label>
            <p className="text-lg">${(status.paidAmount / 100).toFixed(2)}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Balance Due</label>
            <p className="text-lg">${(status.balanceDue / 100).toFixed(2)}</p>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600">Invoice Status</label>
          <p className="text-lg">{status.invoiceStatus.toUpperCase()}</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">Learning Controls</h3>
        <p className="text-sm text-blue-800 mb-4">
          Use these buttons to simulate payment provider callbacks for learning purposes.
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleSimulateSuccess}
            disabled={status.status === "captured" || loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
          >
            Simulate Success
          </button>
          <button
            onClick={handleSimulateFailure}
            disabled={status.status === "failed" || loading}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
          >
            Simulate Failure
          </button>
        </div>
      </div>
    </div>
  );
};
