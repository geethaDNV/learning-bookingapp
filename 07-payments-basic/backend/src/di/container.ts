import { PrismaClient } from "@prisma/client";
import {
  IPaymentRepository,
  IPaymentService,
  IPaymentGatewayProvider,
  IPaymentNumberService,
  IPaymentWebhookService,
  IInvoicePaymentApplicationService,
} from "./contracts.js";
import { PaymentRepository } from "../repositories/PaymentRepository.js";
import { PaymentService } from "../services/PaymentService.js";
import { MockPaymentGatewayProvider } from "../services/MockPaymentGatewayProvider.js";
import { PaymentNumberService } from "../services/PaymentNumberService.js";
import { PaymentWebhookService } from "../services/PaymentWebhookService.js";
import { InvoicePaymentApplicationService } from "../services/InvoicePaymentApplicationService.js";
import { PaymentController } from "../controllers/PaymentController.js";

/**
 * Typed DI Container for payments
 */
export interface Cradle {
  prisma: PrismaClient;
  paymentRepository: IPaymentRepository;
  paymentNumberService: IPaymentNumberService;
  gatewayProvider: IPaymentGatewayProvider;
  invoicePaymentApplicationService: IInvoicePaymentApplicationService;
  paymentWebhookService: IPaymentWebhookService;
  paymentService: IPaymentService;
  paymentController: PaymentController;
}

export function createCradle(prisma: PrismaClient): Cradle {
  const paymentRepository = new PaymentRepository(prisma);
  const paymentNumberService = new PaymentNumberService();
  const gatewayProvider = new MockPaymentGatewayProvider();
  const invoicePaymentApplicationService = new InvoicePaymentApplicationService(prisma);
  const paymentWebhookService = new PaymentWebhookService(
    paymentRepository,
    invoicePaymentApplicationService
  );
  const paymentService = new PaymentService(
    paymentRepository,
    paymentNumberService,
    gatewayProvider,
    paymentWebhookService,
    prisma
  );
  const paymentController = new PaymentController(paymentService, prisma);

  return {
    prisma,
    paymentRepository,
    paymentNumberService,
    gatewayProvider,
    invoicePaymentApplicationService,
    paymentWebhookService,
    paymentService,
    paymentController,
  };
}
