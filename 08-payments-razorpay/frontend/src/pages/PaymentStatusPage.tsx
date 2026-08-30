import React, { useState, useEffect } from "react";
import { Payment } from "../types/payment";
import { paymentApiService } from "../services/paymentApi";

interface PaymentStatusPageProps {
  publicId: string;
}

export const PaymentStatusPage: React.FC<PaymentStatusPageProps> = ({
  publicId,
}) => {
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPaymentStatus();
  }, [publicId]);

  const fetchPaymentStatus = async () => {
    try {
      setLoading(true);
      const data = await paymentApiService.getPaymentStatus(publicId);
      setPayment(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load payment");
      setPayment(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <p>Loading payment status...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "2rem", color: "red" }}>
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={fetchPaymentStatus}>Retry</button>
      </div>
    );
  }

  if (!payment) {
    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <p>Payment not found</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CAPTURED":
        return "green";
      case "FAILED":
        return "red";
      case "PENDING":
        return "orange";
      default:
        return "gray";
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "2rem auto" }}>
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "2rem",
          backgroundColor: "#f9f9f9",
        }}
      >
        <h1>Payment Status</h1>
        <div style={{ marginTop: "1.5rem" }}>
          <div style={{ marginBottom: "1rem" }}>
            <strong>Public ID:</strong> {payment.publicId}
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <strong>Amount:</strong> ₹{payment.amount} {payment.currency}
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <strong>Status:</strong>{" "}
            <span
              style={{
                color: getStatusColor(payment.status),
                fontWeight: "bold",
              }}
            >
              {payment.status}
            </span>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <strong>Provider:</strong> {payment.provider}
            {payment.provider === "mock" && (
              <span style={{ fontSize: "0.9em", color: "blue" }}>
                {" "}
                (Learning Mode)
              </span>
            )}
          </div>

          {payment.hostedUrl && (
            <div style={{ marginBottom: "1rem" }}>
              <strong>Payment Link:</strong>{" "}
              <a href={payment.hostedUrl} target="_blank" rel="noopener noreferrer">
                Open Payment Link
              </a>
            </div>
          )}

          <div style={{ marginBottom: "1rem" }}>
            <strong>Created:</strong>{" "}
            {new Date(payment.createdAt).toLocaleString()}
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <strong>Updated:</strong>{" "}
            {new Date(payment.updatedAt).toLocaleString()}
          </div>
        </div>

        <div
          style={{
            marginTop: "2rem",
            padding: "1rem",
            backgroundColor: "#e8f5e9",
            borderRadius: "4px",
            border: "1px solid #4caf50",
          }}
        >
          <p>
            <strong>ℹ️ Info:</strong> This is a learning module. In production,
            payment status is updated via webhooks from the payment provider.
          </p>
        </div>

        <button
          onClick={fetchPaymentStatus}
          style={{
            marginTop: "1rem",
            padding: "0.5rem 1rem",
            backgroundColor: "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Refresh Status
        </button>
      </div>
    </div>
  );
};
