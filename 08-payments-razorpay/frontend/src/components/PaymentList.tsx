import React, { useState, useEffect } from "react";
import { Payment } from "../types/payment";
import { paymentApiService } from "../services/paymentApi";

interface PaymentListProps {
  onPaymentSelect?: (payment: Payment) => void;
}

export const PaymentList: React.FC<PaymentListProps> = ({ onPaymentSelect }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchPayments();
  }, [page]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const result = await paymentApiService.listPayments(page, 10);
      setPayments(result.payments);
      setTotal(result.total);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load payments"
      );
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return <div>Loading payments...</div>;
  }

  if (error) {
    return (
      <div style={{ color: "red" }}>
        <p>Error: {error}</p>
        <button onClick={fetchPayments}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      <h2>Payments</h2>
      {payments.length === 0 ? (
        <p>No payments found</p>
      ) : (
        <div>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginBottom: "1rem",
            }}
          >
            <thead>
              <tr style={{ borderBottom: "2px solid #ddd" }}>
                <th style={{ textAlign: "left", padding: "0.5rem" }}>
                  Payment ID
                </th>
                <th style={{ textAlign: "left", padding: "0.5rem" }}>Amount</th>
                <th style={{ textAlign: "left", padding: "0.5rem" }}>Status</th>
                <th style={{ textAlign: "left", padding: "0.5rem" }}>
                  Provider
                </th>
                <th style={{ textAlign: "left", padding: "0.5rem" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr
                  key={payment.id}
                  style={{ borderBottom: "1px solid #eee" }}
                >
                  <td style={{ padding: "0.5rem" }}>{payment.publicId}</td>
                  <td style={{ padding: "0.5rem" }}>
                    ₹{payment.amount} {payment.currency}
                  </td>
                  <td style={{ padding: "0.5rem" }}>
                    <span
                      style={{
                        color: getStatusColor(payment.status),
                        fontWeight: "bold",
                      }}
                    >
                      {payment.status}
                    </span>
                  </td>
                  <td style={{ padding: "0.5rem" }}>
                    {payment.provider}
                    {payment.provider === "mock" && (
                      <span style={{ fontSize: "0.9em", color: "blue" }}>
                        {" "}
                        (Learning)
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "0.5rem" }}>
                    <button
                      onClick={() => onPaymentSelect?.(payment)}
                      style={{
                        padding: "0.3rem 0.6rem",
                        backgroundColor: "#2196F3",
                        color: "white",
                        border: "none",
                        borderRadius: "3px",
                        cursor: "pointer",
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ textAlign: "center", marginTop: "1rem" }}>
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              style={{ marginRight: "0.5rem" }}
            >
              Previous
            </button>
            <span>
              Page {page} of {Math.ceil(total / 10)}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= Math.ceil(total / 10)}
              style={{ marginLeft: "0.5rem" }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
