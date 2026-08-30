// Routes for Customer API

import type { Router, Request, Response } from 'express';
import type { ICustomerController } from '@types';

export function registerCustomerRoutes(router: Router, controller: ICustomerController): void {
  // List customers with pagination and search
  router.get('/api/v1/customers', (req: Request, res: Response) =>
    controller.getCustomers(req, res)
  );

  // Search customers
  router.get('/api/v1/customers/search', (req: Request, res: Response) =>
    controller.searchCustomers(req, res)
  );

  // Autocomplete customers
  router.get('/api/v1/customers/autocomplete', (req: Request, res: Response) =>
    controller.autocompleteCustomers(req, res)
  );

  // Get customer by public ID
  router.get('/api/v1/customers/:publicId', (req: Request, res: Response) =>
    controller.getCustomer(req, res)
  );

  // Create customer
  router.post('/api/v1/customers', (req: Request, res: Response) =>
    controller.createCustomer(req, res)
  );

  // Update customer
  router.put('/api/v1/customers/:publicId', (req: Request, res: Response) =>
    controller.updateCustomer(req, res)
  );

  // Update customer status
  router.patch('/api/v1/customers/:publicId/status', (req: Request, res: Response) =>
    controller.setCustomerStatus(req, res)
  );
}
