import { useState, useEffect } from "react";
import { Provider, useDispatch, useSelector } from "react-redux";
import { store } from "./store/store.js";
import {
  postPayment,
  refundPayment,
  fetchPaymentAccounting,
  createPayment,
  clearSuccess,
  clearError,
} from "./store/paymentsSlice.js";
import {
  fetchUnreconciledPayments,
  markPaymentReconciled,
  clearSuccess as clearReconcileSuccess,
  clearError as clearReconcileError,
} from "./store/reconciliationSlice.js";
import { useAppDispatch, useAppSelector } from "./store/hooks.js";
import { JournalEntryTable } from "./components/JournalEntryTable.js";
import { RefundDialog } from "./components/RefundDialog.js";
import { ReconciliationList } from "./components/ReconciliationList.js";
import "./index.css";

function AppContent() {
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState<"posting" | "refund" | "reconciliation">(
    "posting"
  );
  const [invoiceId, setInvoiceId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [showRefundDialog, setShowRefundDialog] = useState(false);

  const paymentsState = useAppSelector((state) => state.payments);
  const reconciliationState = useAppSelector((state) => state.reconciliation);

  useEffect(() => {
    // Fetch unreconciled payments on mount
    dispatch(fetchUnreconciledPayments());
  }, [dispatch]);

  useEffect(() => {
    // Clear messages after 5 seconds
    if (paymentsState.success) {
      const timer = setTimeout(() => dispatch(clearSuccess()), 5000);
      return () => clearTimeout(timer);
    }
  }, [paymentsState.success, dispatch]);

  useEffect(() => {
    if (paymentsState.error) {
      const timer = setTimeout(() => dispatch(clearError()), 5000);
      return () => clearTimeout(timer);
    }
  }, [paymentsState.error, dispatch]);

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceId || !amount) return;

    await dispatch(
      createPayment({
        invoiceId,
        amount: parseFloat(amount),
        paymentMethod,
      })
    );

    setInvoiceId("");
    setAmount("");
    setPaymentMethod("card");
  };

  const handlePostPayment = async () => {
    if (!paymentsState.currentPayment) return;
    await dispatch(
      postPayment({
        paymentId: paymentsState.currentPayment.id,
      })
    );
    if (paymentsState.currentPayment) {
      dispatch(fetchPaymentAccounting(paymentsState.currentPayment.id));
    }
  };

  const handleRefund = async (
    paymentId: string,
    refundAmount: number,
    reason: string
  ) => {
    await dispatch(refundPayment({ paymentId, amount: refundAmount, reason }));
    setShowRefundDialog(false);
  };

  const handleMarkReconciled = async (
    paymentId: string,
    bankReference?: string,
    notes?: string
  ) => {
    await dispatch(
      markPaymentReconciled({ paymentId, bankReference, notes })
    );
    // Refresh the list
    dispatch(fetchUnreconciledPayments());
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4">
          <h1 className="text-3xl font-bold text-gray-900">
            Payments Accounting Advanced
          </h1>
          <p className="text-gray-600 mt-1">
            Learning module for payment posting, refunds, and reconciliation
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4">
        {paymentsState.success && (
          <div className="mb-4 p-4 bg-green-100 text-green-800 rounded">
            ✓ {paymentsState.success}
          </div>
        )}

        {paymentsState.error && (
          <div className="mb-4 p-4 bg-red-100 text-red-800 rounded">
            ✗ {paymentsState.error}
          </div>
        )}

        {reconciliationState.error && (
          <div className="mb-4 p-4 bg-red-100 text-red-800 rounded">
            ✗ {reconciliationState.error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("posting")}
              className={`flex-1 py-4 px-6 font-medium border-b-2 transition ${
                activeTab === "posting"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Payment Posting
            </button>
            <button
              onClick={() => setActiveTab("refund")}
              className={`flex-1 py-4 px-6 font-medium border-b-2 transition ${
                activeTab === "refund"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Refunds
            </button>
            <button
              onClick={() => setActiveTab("reconciliation")}
              className={`flex-1 py-4 px-6 font-medium border-b-2 transition ${
                activeTab === "reconciliation"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Reconciliation
            </button>
          </div>

          <div className="p-6">
            {activeTab === "posting" && (
              <div className="space-y-6">
                <section>
                  <h2 className="text-lg font-semibold mb-4">Create Payment</h2>
                  <form onSubmit={handleCreatePayment} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Invoice ID
                      </label>
                      <input
                        type="text"
                        value={invoiceId}
                        onChange={(e) => setInvoiceId(e.target.value)}
                        disabled={paymentsState.loading}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        placeholder="e.g., INV-001"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Amount
                      </label>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        disabled={paymentsState.loading}
                        step="0.01"
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        placeholder="e.g., 1000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Payment Method
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        disabled={paymentsState.loading}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                      >
                        <option value="card">Credit Card</option>
                        <option value="transfer">Bank Transfer</option>
                        <option value="upi">UPI</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      disabled={paymentsState.loading || !invoiceId || !amount}
                      className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {paymentsState.loading ? "Creating..." : "Create Payment"}
                    </button>
                  </form>
                </section>

                {paymentsState.currentPayment && (
                  <section>
                    <h2 className="text-lg font-semibold mb-4">Post Payment to Accounting</h2>
                    <div className="bg-gray-50 p-4 rounded mb-4">
                      <p className="text-sm mb-2">
                        <strong>Payment ID:</strong> {paymentsState.currentPayment.id}
                      </p>
                      <p className="text-sm mb-2">
                        <strong>Amount:</strong> $
                        {paymentsState.currentPayment.amount.toFixed(2)}
                      </p>
                      <p className="text-sm">
                        <strong>Status:</strong>{" "}
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            paymentsState.currentPayment.isPosted
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {paymentsState.currentPayment.isPosted
                            ? "Posted"
                            : "Captured"}
                        </span>
                      </p>
                    </div>

                    {!paymentsState.currentPayment.isPosted && (
                      <button
                        onClick={handlePostPayment}
                        disabled={paymentsState.loading}
                        className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:bg-gray-400 mb-4"
                      >
                        {paymentsState.loading ? "Posting..." : "Post Payment"}
                      </button>
                    )}

                    {paymentsState.accounting && (
                      <div>
                        <h3 className="text-md font-semibold mb-3">
                          Accounting History
                        </h3>
                        <JournalEntryTable
                          entries={paymentsState.accounting.journalEntries}
                          loading={paymentsState.loading}
                        />
                      </div>
                    )}
                  </section>
                )}
              </div>
            )}

            {activeTab === "refund" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold">Refunds</h2>
                {paymentsState.currentPayment && (
                  <>
                    <div className="bg-gray-50 p-4 rounded">
                      <p className="text-sm mb-2">
                        <strong>Payment ID:</strong> {paymentsState.currentPayment.id}
                      </p>
                      <p className="text-sm mb-2">
                        <strong>Amount:</strong> $
                        {paymentsState.currentPayment.amount.toFixed(2)}
                      </p>
                      <p className="text-sm">
                        <strong>Status:</strong>{" "}
                        <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                          {paymentsState.currentPayment.status}
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={() => setShowRefundDialog(true)}
                      className="w-full bg-orange-600 text-white py-2 rounded hover:bg-orange-700"
                    >
                      Refund Payment
                    </button>
                  </>
                )}
              </div>
            )}

            {activeTab === "reconciliation" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold mb-4">Reconciliation</h2>
                <ReconciliationList
                  payments={reconciliationState.unreconciledPayments}
                  onReconcile={handleMarkReconciled}
                  loading={reconciliationState.loading}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      <RefundDialog
        payment={paymentsState.currentPayment}
        isOpen={showRefundDialog}
        onClose={() => setShowRefundDialog(false)}
        onRefund={handleRefund}
        loading={paymentsState.loading}
      />
    </div>
  );
}

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;
