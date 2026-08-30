import { Request, Response } from "express";
import {
  ICustomerLookupRepository,
  IItemLookupRepository,
} from "../di/contracts.js";
import { CustomerOptionDTO, ItemOptionDTO } from "../types/index.js";

/**
 * SearchController: Handles search and lookup endpoints for autocomplete
 */
export class SearchController {
  constructor(
    private customerLookupRepository: ICustomerLookupRepository,
    private itemLookupRepository: IItemLookupRepository
  ) {}

  /**
   * GET /api/v1/customers/search?q=...
   * Search customers for autocomplete
   */
  async searchCustomers(req: Request, res: Response): Promise<void> {
    try {
      const { q } = req.query;

      if (!q || typeof q !== "string") {
        res.status(400).json({
          success: false,
          message: "Query parameter 'q' is required",
        });
        return;
      }

      const customers = await this.customerLookupRepository.search(q);

      const options: CustomerOptionDTO[] = customers.map((customer) => ({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      }));

      res.json({
        success: true,
        data: options,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * GET /api/v1/items/search?q=...
   * Search items for autocomplete
   */
  async searchItems(req: Request, res: Response): Promise<void> {
    try {
      const { q } = req.query;

      if (!q || typeof q !== "string") {
        res.status(400).json({
          success: false,
          message: "Query parameter 'q' is required",
        });
        return;
      }

      const items = await this.itemLookupRepository.search(q);

      const options: ItemOptionDTO[] = items.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        unitPrice: item.unitPrice.toString(),
        taxRate: item.taxRate.toString(),
      }));

      res.json({
        success: true,
        data: options,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Handle errors and send appropriate responses
   */
  private handleError(error: unknown, res: Response): void {
    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}
