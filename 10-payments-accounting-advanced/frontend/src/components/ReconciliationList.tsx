import React, { useState } from "react";
import { Payment } from "../../types/index.js";

interface ReconciliationListProps {
  payments: Payment[];
  onReconcile: (paymentId: string, bankReference?: string, notes?: string) => Promise<void>;
  loading?: boolean;
}

export const ReconciliationList: React.FC<ReconciliationListProps> = ({
  payments,
  onReconcile,
  loading = false,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [bankRef, setBankRef] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const handleReconcile = async (paymentId: string) => {
    try {
      await onReconcile(paymentId, bankRef || undefined, notes || undefined);
      setExpandedId(null);
      setBankRef("");
      setNotes("");
    } catch (err) {
      console.error("Reconciliation failed:", err);
    }
  };

  if (payments.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No unreconciled payments
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {payments.map((payment) => (
        <div key={payment.id} className="border border-gray-300 rounded">
          <div
            className="bg-gray-50 p-4 cursor-pointer hover:bg-gray-100 flex justify-between items-center"
            onClick={() =>
              setExpandedId(expandedId === payment.id ? null : payment.id)
            }
          >
            <div>
              <div className="font-semibold">{payment.id}</div>
              <div className="text-sm text-gray-600">
                Amount: ${payment.amount.toFixed(2)}
              </div>
            </div>
            <div className="text-sm px-3 py-1 bg-yellow-100 text-yellow-800 rounded">
              Unreconciled
            </div>
          </div>

          {expandedId === payment.id && (
            <div className="p-4 border-t border-gray-300">
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">
                  Bank Reference
                </label>
                <input
                  type="text"
                  value={bankRef}
                  onChange={(e) => setBankRef(e.target.value)}
                  disabled={loading}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  placeholder="e.g., BANK-123456"
                />
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={loading}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  rows={2}
                />
              </div>

              <button
                onClick={() => handleReconcile(payment.id)}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 text-sm"
              >
                {loading ? "Processing..." : "Mark Reconciled"}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
