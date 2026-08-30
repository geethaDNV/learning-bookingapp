import { Router, Request, Response } from "express";
import { InvoiceController } from "../controllers/InvoiceController.js";
import { SearchController } from "../controllers/SearchController.js";
import { Cradle } from "../di/container.js";

/**
 * Create all routes for the invoice feature
 */
export function createInvoiceRoutes(cradle: Cradle): Router {
  const router = Router();

  const invoiceController = new InvoiceController(cradle.invoiceService);
  const searchController = new SearchController(
    cradle.customerLookupRepository,
    cradle.itemLookupRepository
  );

  /**
   * Invoice routes
   */
  router.post("/invoices", (req: Request, res: Response) =>
    invoiceController.createInvoice(req, res)
  );

  router.get("/invoices", (req: Request, res: Response) =>
    invoiceController.listInvoices(req, res)
  );

  router.get("/invoices/:publicId", (req: Request, res: Response) =>
    invoiceController.getInvoice(req, res)
  );

  router.put("/invoices/:publicId", (req: Request, res: Response) =>
    invoiceController.updateInvoice(req, res)
  );

  router.patch("/invoices/:publicId/status", (req: Request, res: Response) =>
    invoiceController.updateInvoiceStatus(req, res)
  );

  /**
   * Search/Autocomplete routes
   */
  router.get("/customers/search", (req: Request, res: Response) =>
    searchController.searchCustomers(req, res)
  );

  router.get("/items/search", (req: Request, res: Response) =>
    searchController.searchItems(req, res)
  );

  return router;
}
