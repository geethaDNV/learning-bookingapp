import { PrismaClient } from "@prisma/client";
import {
  IInvoiceCalculator,
  IInvoiceNumberService,
  ICustomerLookupRepository,
  IItemLookupRepository,
  IInvoiceRepository,
  IInvoiceService,
} from "./contracts.js";
import { InvoiceCalculator } from "../utils/InvoiceCalculator.js";
import { InvoiceNumberService } from "../services/InvoiceNumberService.js";
import {
  CustomerLookupRepository,
  ItemLookupRepository,
} from "../repositories/LookupRepositories.js";
import { InvoiceRepository } from "../repositories/InvoiceRepository.js";
import { InvoiceService } from "../services/InvoiceService.js";

/**
 * Typed DI Container
 * Wires all dependencies for invoice feature
 */
export interface Cradle {
  prisma: PrismaClient;
  calculator: IInvoiceCalculator;
  invoiceNumberService: IInvoiceNumberService;
  customerLookupRepository: ICustomerLookupRepository;
  itemLookupRepository: IItemLookupRepository;
  invoiceRepository: IInvoiceRepository;
  invoiceService: IInvoiceService;
}

export function createCradle(prisma: PrismaClient): Cradle {
  const calculator = new InvoiceCalculator();
  const invoiceNumberService = new InvoiceNumberService(prisma);
  const customerLookupRepository = new CustomerLookupRepository(prisma);
  const itemLookupRepository = new ItemLookupRepository(prisma);
  const invoiceRepository = new InvoiceRepository(prisma);
  const invoiceService = new InvoiceService(
    invoiceRepository,
    invoiceNumberService,
    customerLookupRepository,
    itemLookupRepository,
    calculator
  );

  return {
    prisma,
    calculator,
    invoiceNumberService,
    customerLookupRepository,
    itemLookupRepository,
    invoiceRepository,
    invoiceService,
  };
}
