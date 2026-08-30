import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  sendEmailFormSchema,
  SendEmailFormSchemaType,
  parseEmailCSV,
  formatEmailCSV,
} from '@utils/validationSchemas';
import { invoiceEmailApi } from '@services/invoiceEmailApi';
import { SendEmailResponse, ApiErrorResponse } from '@types/index';
import styles from './SendEmailDialog.module.css';

interface SendEmailDialogProps {
  invoiceId: string;
  invoiceNumber: string;
  customerEmail: string;
  onClose: () => void;
  onSuccess?: (response: SendEmailResponse) => void;
  onError?: (error: ApiErrorResponse | Error) => void;
}

/**
 * Send Invoice Email Dialog Component
 * 
 * Features:
 * - Typed form using React Hook Form + Zod
 * - Email recipients (to, cc, bcc)
 * - Editable subject and body
 * - Optional PDF attachment
 * - Optional payment link
 * - Email preview
 * - Loading and error states
 * 
 * Teaching:
 * - Form validation with Zod + React Hook Form
 * - API integration with axios
 * - Error handling
 * - Component state management
 * - Loading and async operations
 */
export const SendEmailDialog: React.FC<SendEmailDialogProps> = ({
  invoiceId,
  invoiceNumber,
  customerEmail,
  onClose,
  onSuccess,
  onError,
}) => {
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState<{ subject: string; body: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<SendEmailFormSchemaType>({
    resolver: zodResolver(sendEmailFormSchema),
    defaultValues: {
      to: customerEmail,
      cc: '',
      bcc: '',
      subject: `Invoice ${invoiceNumber}`,
      body: `<p>Dear Valued Customer,</p><p>Please find your invoice ${invoiceNumber} attached.</p><p>Best regards</p>`,
      attachPdf: true,
      paymentLink: '',
    },
  });

  const formValues = watch();

  /**
   * Handle preview button click.
   * Fetch email preview from backend without sending.
   */
  const handlePreview = async () => {
    try {
      setLoading(true);
      const preview = await invoiceEmailApi.previewInvoiceEmail(
        invoiceId,
        formValues.to,
        formValues.body
      );
      setPreviewContent({
        subject: preview.subject,
        body: preview.body,
      });
      setShowPreview(true);
    } catch (error) {
      console.error('Failed to preview email:', error);
      if (onError) {
        onError(
          error instanceof Error
            ? error
            : { success: false, message: 'Failed to preview email', timestamp: new Date().toISOString() }
        );
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle form submission.
   * Send email through API.
   */
  const onSubmit = async (data: SendEmailFormSchemaType) => {
    try {
      setLoading(true);

      // Parse CSV email strings into arrays
      const ccEmails = data.cc ? parseEmailCSV(data.cc) : [];
      const bccEmails = data.bcc ? parseEmailCSV(data.bcc) : [];

      // Call API
      const response = await invoiceEmailApi.sendInvoiceEmail(invoiceId, {
        to: data.to,
        cc: ccEmails.length > 0 ? ccEmails : undefined,
        bcc: bccEmails.length > 0 ? bccEmails : undefined,
        subject: data.subject,
        body: data.body,
        attachPdf: data.attachPdf,
        paymentLink: data.paymentLink || undefined,
      });

      // Handle success
      if (response.success) {
        if (onSuccess) {
          onSuccess(response);
        }
        reset();
        onClose();
      } else {
        throw new Error(response.error || response.message);
      }
    } catch (error) {
      console.error('Failed to send email:', error);
      if (onError) {
        onError(
          error instanceof Error
            ? error
            : { success: false, message: 'Failed to send email', timestamp: new Date().toISOString() }
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.dialogOverlay} onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Send Invoice Email</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            disabled={loading}
          >
            ✕
          </button>
        </div>

        {showPreview && previewContent ? (
          <div className={styles.preview}>
            <div className={styles.previewHeader}>
              <h3>Email Preview</h3>
              <button
                type="button"
                className={styles.backButton}
                onClick={() => setShowPreview(false)}
                disabled={loading}
              >
                ← Back to Form
              </button>
            </div>
            <div className={styles.previewContent}>
              <div className={styles.previewField}>
                <label>Subject:</label>
                <p className={styles.previewValue}>{previewContent.subject}</p>
              </div>
              <div className={styles.previewField}>
                <label>Body Preview:</label>
                <div
                  className={styles.previewValue}
                  dangerouslySetInnerHTML={{ __html: previewContent.body.substring(0, 300) + '...' }}
                />
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            {/* To Field */}
            <div className={styles.formGroup}>
              <label htmlFor="to">
                To <span className={styles.required}>*</span>
              </label>
              <input
                id="to"
                type="email"
                placeholder="recipient@example.com"
                {...register('to')}
                disabled={loading}
                className={errors.to ? styles.inputError : ''}
              />
              {errors.to && <span className={styles.error}>{errors.to.message}</span>}
            </div>

            {/* CC Field */}
            <div className={styles.formGroup}>
              <label htmlFor="cc">CC</label>
              <input
                id="cc"
                type="text"
                placeholder="email1@example.com, email2@example.com"
                {...register('cc')}
                disabled={loading}
              />
              <small className={styles.hint}>Comma-separated email addresses</small>
            </div>

            {/* BCC Field */}
            <div className={styles.formGroup}>
              <label htmlFor="bcc">BCC</label>
              <input
                id="bcc"
                type="text"
                placeholder="hidden@example.com"
                {...register('bcc')}
                disabled={loading}
              />
              <small className={styles.hint}>Comma-separated email addresses</small>
            </div>

            {/* Subject Field */}
            <div className={styles.formGroup}>
              <label htmlFor="subject">
                Subject <span className={styles.required}>*</span>
              </label>
              <input
                id="subject"
                type="text"
                placeholder="Invoice subject"
                {...register('subject')}
                disabled={loading}
                className={errors.subject ? styles.inputError : ''}
              />
              {errors.subject && <span className={styles.error}>{errors.subject.message}</span>}
            </div>

            {/* Body Field */}
            <div className={styles.formGroup}>
              <label htmlFor="body">
                Body <span className={styles.required}>*</span>
              </label>
              <textarea
                id="body"
                placeholder="Email body (HTML)"
                rows={8}
                {...register('body')}
                disabled={loading}
                className={errors.body ? styles.inputError : ''}
              />
              {errors.body && <span className={styles.error}>{errors.body.message}</span>}
              <small className={styles.hint}>Supports HTML formatting</small>
            </div>

            {/* Payment Link */}
            <div className={styles.formGroup}>
              <label htmlFor="paymentLink">Payment Link</label>
              <input
                id="paymentLink"
                type="url"
                placeholder="https://pay.example.com/invoice/123"
                {...register('paymentLink')}
                disabled={loading}
              />
              <small className={styles.hint}>Optional link to payment page</small>
            </div>

            {/* Attach PDF Checkbox */}
            <div className={styles.formGroup}>
              <label htmlFor="attachPdf" className={styles.checkboxLabel}>
                <input
                  id="attachPdf"
                  type="checkbox"
                  {...register('attachPdf')}
                  disabled={loading}
                />
                Attach PDF
              </label>
            </div>

            {/* Buttons */}
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.buttonSecondary}
                onClick={handlePreview}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Preview'}
              </button>
              <button
                type="button"
                className={styles.buttonSecondary}
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.buttonPrimary}
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
