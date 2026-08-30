import { PrismaClient } from "@prisma/client";
import { IPaymentRepository } from "./contracts.js";
import { IPaymentService } from "./contracts.js";
import { IPaymentGatewayProvider } from "./contracts.js";
import { IPaymentNumberService } from "./contracts.js";
import { IPaymentWebhookService } from "./contracts.js";
import { IInvoicePaymentApplicationService } from "./contracts.js";
import { PaymentRepository } from "../repositories/PaymentRepository.js";
import { PaymentService } from "../services/PaymentService.js";
import { MockPaymentGatewayProvider } from "../services/MockPaymentGatewayProvider.js";
import { RazorpayGatewayProvider } from "../services/RazorpayGatewayProvider.js";
import { PaymentNumberService } from "../services/PaymentNumberService.js";
import { PaymentWebhookService } from "../services/PaymentWebhookService.js";
import { InvoicePaymentApplicationService } from "../services/InvoicePaymentApplicationService.js";
import { PaymentController } from "../controllers/PaymentController.js";
import config from "../config.js";

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
  // Select provider based on config
  const gatewayProvider: IPaymentGatewayProvider =
    config.paymentProvider === "razorpay" &&
    config.razorpay.keyId &&
    config.razorpay.keySecret
      ? new RazorpayGatewayProvider()
      : new MockPaymentGatewayProvider();

  // Initialize services with dependencies
  const paymentRepository = new PaymentRepository(prisma);
  const paymentNumberService = new PaymentNumberService();
  const invoicePaymentApplicationService = new InvoicePaymentApplicationService(
    prisma
  );
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
  const paymentController = new PaymentController(
    paymentService,
    gatewayProvider,
    prisma
  );

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
