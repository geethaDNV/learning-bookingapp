import React, { useState } from "react";
import { Payment } from "./types/payment";
import { PaymentStatusPage } from "./pages/PaymentStatusPage";
import { PaymentList } from "./components/PaymentList";
import { CreatePaymentLinkForm } from "./components/CreatePaymentLinkForm";
import "./App.css";

function App() {
  const [view, setView] = useState<"list" | "create" | "status">("list");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const handlePaymentCreated = (payment: Payment) => {
    setSelectedPayment(payment);
    setView("status");
  };

  const handlePaymentSelect = (payment: Payment) => {
    setSelectedPayment(payment);
    setView("status");
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Payment Learning Module - 08 Razorpay</h1>
        <p>Understanding payment gateway integration</p>
      </header>

      <nav className="app-nav">
        <button
          className={view === "list" ? "active" : ""}
          onClick={() => setView("list")}
        >
          Payments List
        </button>
        <button
          className={view === "create" ? "active" : ""}
          onClick={() => setView("create")}
        >
          Create Payment
        </button>
        {selectedPayment && (
          <button
            className={view === "status" ? "active" : ""}
            onClick={() => setView("status")}
          >
            Payment Status
          </button>
        )}
      </nav>

      <main className="app-main">
        {view === "list" && (
          <PaymentList onPaymentSelect={handlePaymentSelect} />
        )}

        {view === "create" && (
          <div>
            <h2>Create Payment Link</h2>
            <p>Invoice ID (from learning module invoices):</p>
            <input
              type="text"
              id="invoiceId"
              placeholder="e.g., invoice-uuid"
              style={{ width: "100%", padding: "0.5rem", marginBottom: "1rem" }}
            />
            <CreatePaymentLinkForm
              invoiceId={
                (document.getElementById("invoiceId") as HTMLInputElement)
                  ?.value || ""
              }
              onSuccess={handlePaymentCreated}
            />
          </div>
        )}

        {view === "status" && selectedPayment && (
          <PaymentStatusPage publicId={selectedPayment.publicId} />
        )}
      </main>

      <footer className="app-footer">
        <p>
          📚 Learning Module | Provider: Check server logs for active provider
          (mock or razorpay)
        </p>
      </footer>
    </div>
  );
}

export default App;
