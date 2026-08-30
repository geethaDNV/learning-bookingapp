import config from '@config/index';
import {
  IEmailService,
  IInvoiceEmailService,
  IInvoiceRepository,
  ICustomerRepository,
} from '@types/index';
import { MockEmailService } from '@services/mockEmailService';
import { ResendEmailService } from '@services/resendEmailService';
import { InvoiceEmailService } from '@services/invoiceEmailService';
import { InMemoryInvoiceRepository } from '@services/repositories/inMemoryInvoiceRepository';
import { InMemoryCustomerRepository } from '@services/repositories/inMemoryCustomerRepository';

/**
 * Dependency Injection Container.
 * 
 * Responsible for:
 * 1. Creating all service instances
 * 2. Wiring dependencies together
 * 3. Managing singleton/scoped instances
 * 4. Providing to controllers/routes
 * 
 * This teaches:
 * - Inversion of Control (IoC)
 * - Dependency Injection pattern
 * - Switching implementations (Mock ↔ Resend) via config
 * - Type-safe dependency management
 */
export class ServiceContainer {
  private static instance: ServiceContainer;

  private emailService: IEmailService;
  private invoiceRepository: IInvoiceRepository;
  private customerRepository: ICustomerRepository;
  private invoiceEmailService: IInvoiceEmailService;

  private constructor() {
    // Initialize repositories
    this.invoiceRepository = new InMemoryInvoiceRepository();
    this.customerRepository = new InMemoryCustomerRepository();

    // Initialize email service based on config
    if (config.email.provider === 'resend') {
      if (!config.email.apiKey) {
        console.warn(
          'RESEND_API_KEY not configured. Falling back to mock email service.'
        );
        this.emailService = new MockEmailService(config.email.from);
      } else {
        this.emailService = new ResendEmailService(
          config.email.apiKey,
          config.email.from
        );
        console.log('[DI] Using Resend email provider');
      }
    } else {
      this.emailService = new MockEmailService(config.email.from);
      console.log('[DI] Using Mock email provider');
    }

    // Initialize business logic service
    this.invoiceEmailService = new InvoiceEmailService(
      this.emailService,
      this.invoiceRepository,
      this.customerRepository
    );
  }

  /**
   * Get singleton instance.
   */
  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  /**
   * Get email service (Mock or Resend).
   */
  getEmailService(): IEmailService {
    return this.emailService;
  }

  /**
   * Get invoice repository.
   */
  getInvoiceRepository(): IInvoiceRepository {
    return this.invoiceRepository;
  }

  /**
   * Get customer repository.
   */
  getCustomerRepository(): ICustomerRepository {
    return this.customerRepository;
  }

  /**
   * Get invoice email service (orchestrator).
   */
  getInvoiceEmailService(): IInvoiceEmailService {
    return this.invoiceEmailService;
  }
}
