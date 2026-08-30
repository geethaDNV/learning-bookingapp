import { IEmailService, SendInvoiceEmailInput, SendEmailResult } from '@types/index';
import { EMAIL_DEFAULTS, EMAIL_CONSTRAINTS } from '@constants/index';

/**
 * Mock Email Service for local development and testing.
 * 
 * Simulates email provider behavior without making actual API calls.
 * Perfect for learning and testing email workflows in isolation.
 * 
 * In production learning:
 * - Demonstrates email service contract
 * - Logs sent emails to console
 * - Generates fake message IDs
 * - Validates recipients just like real provider would
 */
export class MockEmailService implements IEmailService {
  private readonly emailFrom: string;
  private sentEmails: Array<{
    messageId: string;
    input: SendInvoiceEmailInput;
    timestamp: Date;
  }> = [];

  constructor(emailFrom: string = EMAIL_DEFAULTS.FROM) {
    this.emailFrom = emailFrom;
  }

  /**
   * Validate email address using simple regex.
   * Real providers do more sophisticated validation.
   */
  validateEmail(email: string): boolean {
    return EMAIL_CONSTRAINTS.EMAIL_REGEX.test(email);
  }

  /**
   * Send invoice email.
   * 
   * Simulates real provider by:
   * 1. Validating recipient and CC/BCC emails
   * 2. Checking for required fields
   * 3. Logging the email (in real provider, this would call Resend API)
   * 4. Returning success with fake messageId
   * 
   * On validation error, throws like real provider would.
   */
  async sendInvoiceEmail(input: SendInvoiceEmailInput): Promise<SendEmailResult> {
    // Simulate network delay
    await this.simulateDelay(200);

    // Validate primary recipient
    if (!this.validateEmail(input.to)) {
      console.error(`[MockEmailService] Invalid recipient: ${input.to}`);
      return {
        success: false,
        error: `Invalid email address: ${input.to}`,
        provider: 'mock',
      };
    }

    // Validate CC recipients
    if (input.cc && input.cc.length > 0) {
      const invalidCc = input.cc.find((email) => !this.validateEmail(email));
      if (invalidCc) {
        console.error(`[MockEmailService] Invalid CC recipient: ${invalidCc}`);
        return {
          success: false,
          error: `Invalid CC email address: ${invalidCc}`,
          provider: 'mock',
        };
      }
    }

    // Validate BCC recipients
    if (input.bcc && input.bcc.length > 0) {
      const invalidBcc = input.bcc.find((email) => !this.validateEmail(email));
      if (invalidBcc) {
        console.error(`[MockEmailService] Invalid BCC recipient: ${invalidBcc}`);
        return {
          success: false,
          error: `Invalid BCC email address: ${invalidBcc}`,
          provider: 'mock',
        };
      }
    }

    // Validate required fields
    if (!input.subject || !input.body || !input.invoiceNumber) {
      console.error('[MockEmailService] Missing required fields');
      return {
        success: false,
        error: 'Missing required fields: subject, body, invoiceNumber',
        provider: 'mock',
      };
    }

    // Generate fake message ID (like Resend does)
    const messageId = `mock_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Log the email details (in real app, this would be sent via API)
    const emailLog = {
      timestamp: new Date().toISOString(),
      provider: 'mock',
      from: this.emailFrom,
      to: input.to,
      cc: input.cc?.join(', ') || 'none',
      bcc: input.bcc?.join(', ') || 'none',
      subject: input.subject,
      bodyPreview: input.body.substring(0, 100) + (input.body.length > 100 ? '...' : ''),
      hasAttachment: !!input.invoicePdfBuffer,
      messageId,
    };

    console.log(
      '[MockEmailService] Email sent successfully:',
      JSON.stringify(emailLog, null, 2)
    );

    // Store in memory (useful for testing)
    this.sentEmails.push({
      messageId,
      input,
      timestamp: new Date(),
    });

    return {
      messageId,
      success: true,
      provider: 'mock',
    };
  }

  /**
   * Get all emails sent during this session (testing helper).
   */
  getSentEmails() {
    return this.sentEmails;
  }

  /**
   * Clear sent emails history (testing helper).
   */
  clearSentEmails() {
    this.sentEmails = [];
  }

  /**
   * Simulate network delay to mimic real provider behavior.
   */
  private simulateDelay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
