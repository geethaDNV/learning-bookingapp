// DI Container - Dependency Injection setup

import { PrismaClient } from '@prisma/client';
import { CustomerRepository } from '@repositories';
import { CustomerService } from '@services';
import { CustomerController } from '@controllers';
import type {
  ICustomerRepository,
  ICustomerService,
  ICustomerController,
} from '@types';

export interface Cradle {
  prisma: PrismaClient;
  customerRepository: ICustomerRepository;
  customerService: ICustomerService;
  customerController: ICustomerController;
}

export function createContainer(): Cradle {
  const prisma = new PrismaClient();

  const customerRepository: ICustomerRepository = new CustomerRepository(prisma);
  const customerService: ICustomerService = new CustomerService(customerRepository);
  const customerController: ICustomerController = new CustomerController(customerService);

  return {
    prisma,
    customerRepository,
    customerService,
    customerController,
  };
}

let container: Cradle | null = null;

export function getContainer(): Cradle {
  if (!container) {
    container = createContainer();
  }
  return container;
}

export async function closeContainer(): Promise<void> {
  if (container) {
    await container.prisma.$disconnect();
    container = null;
  }
}
