import {
  IEmailService,
  IInvoiceEmailService,
  IInvoiceRepository,
  ICustomerRepository,
  SendInvoiceEmailInput,
  SendEmailResult,
  Invoice,
  Customer,
} from '@types/index';
import { EMAIL_TEMPLATES } from '@constants/index';
import { ValidationError, NotFoundError } from '@errors/index';

/**
 * Invoice Email Service - Business logic for invoice email workflow.
 * 
 * Orchestrates:
 * 1. Load invoice and customer data
 * 2. Prepare email content (subject, body, template)
 * 3. Include payment link if provided
 * 4. Call email service (mock or Resend)
 * 
 * This is the layer between controller and email provider.
 * Teaches separation of concerns:
 * - Controller: HTTP concerns
 * - InvoiceEmailService: Business logic
 * - EmailService: Provider abstraction
 */
export class InvoiceEmailService implements IInvoiceEmailService {
  constructor(
    private emailService: IEmailService,
    private invoiceRepository: IInvoiceRepository,
    private customerRepository: ICustomerRepository
  ) {}

  /**
   * Send invoice email by orchestrating the full workflow.
   */
  async sendInvoiceEmail(input: SendInvoiceEmailInput): Promise<SendEmailResult> {
    // Validate recipient email
    if (!this.emailService.validateEmail(input.to)) {
      throw new ValidationError('Invalid recipient email address');
    }

    // All setup done, send email
    return this.emailService.sendInvoiceEmail(input);
  }

  /**
   * Generate email preview without sending.
   * Useful for frontend to show user what will be sent.
   */
  async previewInvoiceEmail(
    invoiceId: string,
    customizableBody?: string
  ): Promise<{ subject: string; body: string }> {
    // Load invoice data
    const invoice = await this.invoiceRepository.findById(invoiceId);
    if (!invoice) {
      throw new NotFoundError('Invoice', invoiceId);
    }

    // Load customer data
    const customer = await this.customerRepository.findById(invoice.customerId);
    if (!customer) {
      throw new NotFoundError('Customer', invoice.customerId);
    }

    // Format amount and date
    const formattedAmount = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(invoice.amount);

    const formattedDueDate = new Date(invoice.dueDate).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    // Generate subject
    const subject = EMAIL_TEMPLATES.INVOICE_SUBJECT(invoice.invoiceNumber, 'Our Company');

    // Use custom body if provided, otherwise generate from template
    const body = customizableBody || this.generateEmailBody(
      invoice.invoiceNumber,
      formattedAmount,
      formattedDueDate,
      customer.name
    );

    return { subject, body };
  }

  /**
   * Helper to generate email body from template.
   */
  private generateEmailBody(
    invoiceNumber: string,
    amount: string,
    dueDate: string,
    customerName: string
  ): string {
    return EMAIL_TEMPLATES.INVOICE_BODY_HTML({
      invoiceNumber,
      amount,
      dueDate,
      orgName: 'Our Company',
      customerName,
    });
  }
}
