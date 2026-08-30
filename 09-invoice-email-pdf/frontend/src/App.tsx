import React, { useState, useEffect } from 'react';
import { SendEmailDialog } from '@components/SendEmailDialog';
import { SendEmailResponse, ApiErrorResponse } from '@types/index';
import { invoiceEmailApi } from '@services/invoiceEmailApi';
import './App.css';

/**
 * Main App Component
 * 
 * Demonstrates invoice email workflow:
 * 1. Display invoice and customer info
 * 2. Send email button opens dialog
 * 3. Form for composing email with recipients/subject/body
 * 4. Preview before sending
 * 5. Send and show result
 */
function App() {
  const [showDialog, setShowDialog] = useState(false);
  const [apiReady, setApiReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Sample invoice data (in real app, would load from backend)
  const invoiceId = 'inv-001';
  const invoiceNumber = 'INV-2024-001';
  const customerEmail = 'billing@acme.com';
  const amount = 10000;
  const dueDate = '2024-09-30';

  /**
   * Check if API is ready on mount.
   */
  useEffect(() => {
    const checkApi = async () => {
      try {
        const isReady = await invoiceEmailApi.checkHealth();
        setApiReady(isReady);
      } finally {
        setLoading(false);
      }
    };

    checkApi();
  }, []);

  /**
   * Handle successful email send.
   */
  const handleSuccess = (response: SendEmailResponse) => {
    setStatus({
      type: 'success',
      message: `✓ Email sent successfully! Message ID: ${response.messageId || 'N/A'}`,
    });

    // Clear status after 5 seconds
    setTimeout(() => setStatus(null), 5000);
  };

  /**
   * Handle email send error.
   */
  const handleError = (error: ApiErrorResponse | Error) => {
    const message = error instanceof Error ? error.message : error.message;
    setStatus({
      type: 'error',
      message: `✗ Failed to send email: ${message}`,
    });
  };

  if (loading) {
    return (
      <div className="app">
        <div className="container">
          <div className="loadingState">
            <h2>Initializing...</h2>
            <p>Checking API connection...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!apiReady) {
    return (
      <div className="app">
        <div className="container">
          <div className="errorState">
            <h2>API Not Available</h2>
            <p>Backend server is not running. Start it with:</p>
            <code>cd backend && npm run dev</code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="container">
        {/* Header */}
        <header className="header">
          <h1>Invoice Email Module</h1>
          <p className="subtitle">Send invoice emails with custom recipients and content</p>
        </header>

        {/* Status Messages */}
        {status && (
          <div className={`statusMessage ${status.type}`}>
            {status.message}
          </div>
        )}

        {/* Invoice Card */}
        <div className="card">
          <div className="cardHeader">
            <h2>Invoice {invoiceNumber}</h2>
            <span className="badge sent">Sent</span>
          </div>

          <div className="cardBody">
            <div className="infoRow">
              <span className="label">Customer Email:</span>
              <span className="value">{customerEmail}</span>
            </div>
            <div className="infoRow">
              <span className="label">Amount:</span>
              <span className="value">₹{amount.toLocaleString('en-IN')}</span>
            </div>
            <div className="infoRow">
              <span className="label">Due Date:</span>
              <span className="value">{dueDate}</span>
            </div>
            <div className="infoRow">
              <span className="label">Invoice ID:</span>
              <span className="value monospace">{invoiceId}</span>
            </div>
          </div>

          <div className="cardActions">
            <button
              className="buttonPrimary"
              onClick={() => setShowDialog(true)}
            >
              📧 Send Email
            </button>
          </div>
        </div>

        {/* Features List */}
        <div className="card">
          <h3>Features</h3>
          <ul className="featureList">
            <li><strong>Recipients:</strong> To, CC, and BCC fields with validation</li>
            <li><strong>Customizable Content:</strong> Edit subject and HTML body</li>
            <li><strong>Email Preview:</strong> See exactly what will be sent</li>
            <li><strong>PDF Attachment:</strong> Optional invoice PDF attachment</li>
            <li><strong>Payment Link:</strong> Include payment link in email</li>
            <li><strong>Mock & Real Providers:</strong> Switch between mock (dev) and Resend (prod)</li>
            <li><strong>Type Safety:</strong> Full TypeScript with Zod validation</li>
            <li><strong>Error Handling:</strong> Comprehensive error messages and validation</li>
          </ul>
        </div>

        {/* Code Example */}
        <div className="card">
          <h3>API Example</h3>
          <pre className="codeBlock">{`POST /api/v1/invoices/inv-001/send-email
{
  "to": "customer@example.com",
  "cc": ["cc@example.com"],
  "subject": "Invoice INV-2024-001",
  "body": "<p>Please find your invoice attached.</p>",
  "attachPdf": true,
  "paymentLink": "https://pay.example.com/..."
}`}</pre>
        </div>
      </div>

      {/* Send Email Dialog */}
      {showDialog && (
        <SendEmailDialog
          invoiceId={invoiceId}
          invoiceNumber={invoiceNumber}
          customerEmail={customerEmail}
          onClose={() => setShowDialog(false)}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      )}
    </div>
  );
}

export default App;
