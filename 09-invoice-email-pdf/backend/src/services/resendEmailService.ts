import { Resend } from 'resend';
import { IEmailService, SendInvoiceEmailInput, SendEmailResult } from '@types/index';
import { EMAIL_DEFAULTS, EMAIL_CONSTRAINTS, EMAIL_ERROR_MESSAGES } from '@constants/index';
import { ValidationError } from '@errors/index';

/**
 * Resend Email Service - Production email provider.
 * 
 * Sends emails through Resend API for real delivery.
 * Implements the same IEmailService contract as MockEmailService.
 * 
 * This teaches:
 * - How to integrate real external APIs
 * - Provider configuration and error handling
 * - Typed wrapper around third-party library
 */
export class ResendEmailService implements IEmailService {
  private readonly resendClient: Resend;
  private readonly emailFrom: string;

  constructor(apiKey: string, emailFrom: string = EMAIL_DEFAULTS.FROM) {
    if (!apiKey) {
      throw new Error(EMAIL_ERROR_MESSAGES.RESEND_API_KEY_MISSING);
    }
    this.resendClient = new Resend(apiKey);
    this.emailFrom = emailFrom;
  }

  /**
   * Validate email address.
   */
  validateEmail(email: string): boolean {
    if (!email || email.length > EMAIL_CONSTRAINTS.MAX_EMAIL_LENGTH) {
      return false;
    }
    return EMAIL_CONSTRAINTS.EMAIL_REGEX.test(email);
  }

  /**
   * Send invoice email through Resend API.
   * 
   * Steps:
   * 1. Validate all recipient emails
   * 2. Prepare email payload
   * 3. Call Resend API
   * 4. Handle provider-specific errors
   * 5. Return result
   * 
   * Throws ValidationError if inputs are invalid.
   * Returns error result (not throw) for API failures.
   */
  async sendInvoiceEmail(input: SendInvoiceEmailInput): Promise<SendEmailResult> {
    try {
      // Validate primary recipient
      if (!this.validateEmail(input.to)) {
        throw new ValidationError(EMAIL_ERROR_MESSAGES.INVALID_RECIPIENT, {
          to: [`Invalid email format: ${input.to}`],
        });
      }

      // Validate CC recipients if provided
      if (input.cc && input.cc.length > 0) {
        const invalidCc = input.cc.filter((email) => !this.validateEmail(email));
        if (invalidCc.length > 0) {
          throw new ValidationError('Invalid CC recipient', {
            cc: [`Invalid emails: ${invalidCc.join(', ')}`],
          });
        }
      }

      // Validate BCC recipients if provided
      if (input.bcc && input.bcc.length > 0) {
        const invalidBcc = input.bcc.filter((email) => !this.validateEmail(email));
        if (invalidBcc.length > 0) {
          throw new ValidationError('Invalid BCC recipient', {
            bcc: [`Invalid emails: ${invalidBcc.join(', ')}`],
          });
        }
      }

      // Prepare email payload for Resend
      const emailPayload: any = {
        from: this.emailFrom,
        to: input.to,
        subject: input.subject,
        html: input.body,
      };

      // Add optional fields
      if (input.cc && input.cc.length > 0) {
        emailPayload.cc = input.cc;
      }

      if (input.bcc && input.bcc.length > 0) {
        emailPayload.bcc = input.bcc;
      }

      // Add PDF attachment if provided
      if (input.invoicePdfBuffer) {
        emailPayload.attachments = [
          {
            filename: `${input.invoiceNumber}.pdf`,
            content: input.invoicePdfBuffer,
          },
        ];
      }

      // Call Resend API
      console.log(`[ResendEmailService] Sending email to ${input.to}...`);
      const response = await this.resendClient.emails.send(emailPayload);

      // Handle API response
      if (response.error) {
        console.error('[ResendEmailService] Resend API error:', response.error);

        // Check for specific error types
        if (response.error.message?.includes('not verified')) {
          return {
            success: false,
            error: 'Email domain not verified. Dev tier can only send to verified addresses.',
            provider: 'resend',
          };
        }

        return {
          success: false,
          error: response.error.message || EMAIL_ERROR_MESSAGES.SEND_FAILED,
          provider: 'resend',
        };
      }

      console.log(`[ResendEmailService] Email sent successfully. Message ID: ${response.data?.id}`);

      return {
        messageId: response.data?.id,
        success: true,
        provider: 'resend',
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : EMAIL_ERROR_MESSAGES.SEND_FAILED;
      console.error('[ResendEmailService] Unexpected error:', errorMessage);

      return {
        success: false,
        error: errorMessage,
        provider: 'resend',
      };
    }
  }
}
