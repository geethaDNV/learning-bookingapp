import { Request, Response } from "express";
import { z } from "zod";
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  updateInvoiceStatusSchema,
  listInvoicesQuerySchema,
} from "../schemas/index.js";
import { IInvoiceService } from "../di/contracts.js";

/**
 * InvoiceController: Handles HTTP requests for invoice operations
 */
export class InvoiceController {
  constructor(private invoiceService: IInvoiceService) {}

  /**
   * POST /api/v1/invoices
   * Create a new invoice
   */
  async createInvoice(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = createInvoiceSchema.parse(req.body);

      const result = await this.invoiceService.createInvoice({
        customerId: validatedData.customerId,
        dueDate: validatedData.dueDate ?? null,
        notes: validatedData.notes ?? null,
        lines: validatedData.lines.map((line) => ({
          itemId: line.itemId,
          quantity: Number(line.quantity),
          rate: Number(line.rate),
        })),
      });

      const invoice = await this.invoiceService.getInvoice(result.publicId);

      res.status(201).json({
        success: true,
        data: invoice,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * GET /api/v1/invoices/:publicId
   * Retrieve a specific invoice
   */
  async getInvoice(req: Request, res: Response): Promise<void> {
    try {
      const { publicId } = req.params;
      const invoice = await this.invoiceService.getInvoice(publicId);

      res.json({
        success: true,
        data: invoice,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * PUT /api/v1/invoices/:publicId
   * Update a draft invoice
   */
  async updateInvoice(req: Request, res: Response): Promise<void> {
    try {
      const { publicId } = req.params;
      const validatedData = updateInvoiceSchema.parse(req.body);

      await this.invoiceService.updateInvoice(publicId, {
        customerId: validatedData.customerId,
        dueDate: validatedData.dueDate ?? undefined,
        notes: validatedData.notes,
        lines: validatedData.lines?.map((line) => ({
          id: line.id,
          itemId: line.itemId,
          quantity: Number(line.quantity),
          rate: Number(line.rate),
        })),
      });

      const invoice = await this.invoiceService.getInvoice(publicId);

      res.json({
        success: true,
        data: invoice,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * PATCH /api/v1/invoices/:publicId/status
   * Update invoice status
   */
  async updateInvoiceStatus(req: Request, res: Response): Promise<void> {
    try {
      const { publicId } = req.params;
      const validatedData = updateInvoiceStatusSchema.parse(req.body);

      await this.invoiceService.updateInvoiceStatus(
        publicId,
        validatedData.status
      );

      const invoice = await this.invoiceService.getInvoice(publicId);

      res.json({
        success: true,
        data: invoice,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * GET /api/v1/invoices
   * List invoices with optional filters
   */
  async listInvoices(req: Request, res: Response): Promise<void> {
    try {
      const validatedQuery = listInvoicesQuerySchema.parse(req.query);

      const result = await this.invoiceService.listInvoices({
        customerId: validatedQuery.customerId,
        status: validatedQuery.status,
        skip: validatedQuery.skip,
        take: validatedQuery.take,
      });

      res.json({
        success: true,
        data: result.items,
        pagination: {
          skip: validatedQuery.skip,
          take: validatedQuery.take,
          total: result.total,
        },
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Handle errors and send appropriate responses
   */
  private handleError(error: unknown, res: Response): void {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
      return;
    }

    if (error instanceof Error) {
      if (
        error.message.includes("not found") ||
        error.message.includes("Not found")
      ) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

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
