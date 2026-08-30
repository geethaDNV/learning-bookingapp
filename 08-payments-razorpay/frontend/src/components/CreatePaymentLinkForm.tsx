import React, { useState } from "react";
import { Payment } from "../types/payment";
import { paymentApiService } from "../services/paymentApi";

interface CreatePaymentLinkFormProps {
  invoiceId: string;
  onSuccess?: (payment: Payment) => void;
}

export const CreatePaymentLinkForm: React.FC<CreatePaymentLinkFormProps> = ({
  invoiceId,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreatePaymentLink = async () => {
    try {
      setLoading(true);
      setError(null);
      const payment = await paymentApiService.createPaymentLink(invoiceId);
      onSuccess?.(payment);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create payment link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleCreatePaymentLink}
        disabled={loading}
        style={{
          padding: "0.5rem 1rem",
          backgroundColor: loading ? "#ccc" : "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Creating..." : "Create Payment Link"}
      </button>

      {error && (
        <div
          style={{
            marginTop: "1rem",
            padding: "1rem",
            backgroundColor: "#ffebee",
            border: "1px solid #f44336",
            borderRadius: "4px",
            color: "#f44336",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
};
