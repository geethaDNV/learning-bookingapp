import React, { useState } from "react";
import { Payment, RefundResult } from "../../types/index.js";

interface RefundDialogProps {
  payment: Payment | null;
  isOpen: boolean;
  onClose: () => void;
  onRefund: (paymentId: string, amount: number, reason: string) => Promise<void>;
  loading?: boolean;
}

export const RefundDialog: React.FC<RefundDialogProps> = ({
  payment,
  isOpen,
  onClose,
  onRefund,
  loading = false,
}) => {
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleRefund = async () => {
    setError("");

    if (!amount || amount <= 0) {
      setError("Amount must be greater than 0");
      return;
    }

    if (!payment || amount > payment.amount) {
      setError(`Amount cannot exceed payment amount of ${payment?.amount}`);
      return;
    }

    if (!reason.trim()) {
      setError("Reason is required");
      return;
    }

    try {
      await onRefund(payment.id, amount, reason);
      setAmount(0);
      setReason("");
      onClose();
    } catch (err) {
      setError((err as Error).message || "Refund failed");
    }
  };

  if (!isOpen || !payment) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <h2 className="text-lg font-bold mb-4">Refund Payment</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Payment ID</label>
          <input
            type="text"
            value={payment.id}
            disabled
            className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-50"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Payment Amount
          </label>
          <input
            type="number"
            value={payment.amount}
            disabled
            className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-50"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Refund Amount
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            disabled={loading}
            step="0.01"
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Reason</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={loading}
            className="w-full border border-gray-300 rounded px-3 py-2"
            rows={3}
          />
        </div>

        {error && <div className="mb-4 text-red-600 text-sm">{error}</div>}

        <div className="flex gap-2">
          <button
            onClick={handleRefund}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "Processing..." : "Refund"}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 bg-gray-300 text-gray-800 py-2 rounded hover:bg-gray-400 disabled:bg-gray-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
