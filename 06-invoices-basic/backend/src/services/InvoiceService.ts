import { Decimal } from "@prisma/client/runtime/library";
import {
  IInvoiceService,
  IInvoiceRepository,
  IInvoiceNumberService,
  ICustomerLookupRepository,
  IItemLookupRepository,
  IInvoiceCalculator,
} from "../di/contracts.js";
import { InvoiceDTO, InvoiceLineDTO } from "../types/index.js";

/**
 * InvoiceService: Implements invoice business logic
 * Depends on repositories and services via constructor injection
 */
export class InvoiceService implements IInvoiceService {
  constructor(
    private invoiceRepository: IInvoiceRepository,
    private invoiceNumberService: IInvoiceNumberService,
    private customerLookupRepository: ICustomerLookupRepository,
    private itemLookupRepository: IItemLookupRepository,
    private calculator: IInvoiceCalculator
  ) {}

  async createInvoice(data: {
    customerId: number;
    dueDate: string | null;
    notes: string | null;
    lines: Array<{
      itemId: number;
      quantity: number;
      rate: number;
    }>;
  }): Promise<{ id: number; publicId: string; invoiceNumber: string }> {
    // Validate customer exists
    await this.customerLookupRepository.findById(data.customerId);

    // Validate items exist and calculate line totals
    const calculatedLines = await Promise.all(
      data.lines.map(async (line) => {
        const item = await this.itemLookupRepository.findById(line.itemId);
        const taxRate = Number(item.taxRate);
        const calculated = this.calculator.calculateLine(
          line.quantity,
          line.rate,
          taxRate
        );

        return {
          itemId: line.itemId,
          quantity: this.calculator.toDecimal(calculated.quantity),
          rate: this.calculator.toDecimal(calculated.rate),
          taxRate: this.calculator.toDecimal(calculated.taxRate),
          lineSubtotal: this.calculator.toDecimal(calculated.subtotal),
          lineTax: this.calculator.toDecimal(calculated.tax),
          lineTotal: this.calculator.toDecimal(calculated.total),
        };
      })
    );

    // Calculate invoice totals
    const lineCalculations = calculatedLines.map((line) => ({
      quantity: Number(line.quantity),
      rate: Number(line.rate),
      taxRate: Number(line.taxRate),
      subtotal: Number(line.lineSubtotal),
      tax: Number(line.lineTax),
      total: Number(line.lineTotal),
    }));

    const totals = this.calculator.calculateTotals(lineCalculations);

    // Generate invoice number
    const invoiceNumber = await this.invoiceNumberService.generateInvoiceNumber();

    // Create invoice with lines
    return this.invoiceRepository.create({
      invoiceNumber,
      customerId: data.customerId,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      notes: data.notes || null,
      subtotal: this.calculator.toDecimal(totals.subtotal),
      totalTax: this.calculator.toDecimal(totals.totalTax),
      total: this.calculator.toDecimal(totals.total),
      lines: calculatedLines,
    });
  }

  async getInvoice(publicId: string): Promise<InvoiceDTO> {
    const invoice = await this.invoiceRepository.findByPublicId(publicId);

    if (!invoice) {
      throw new Error(`Invoice ${publicId} not found`);
    }

    return this.mapToDTO(invoice);
  }

  async updateInvoice(
    publicId: string,
    data: {
      customerId?: number;
      dueDate?: string | null;
      notes?: string;
      lines?: Array<{
        id?: number;
        itemId: number;
        quantity: number;
        rate: number;
      }>;
    }
  ): Promise<void> {
    const invoice = await this.invoiceRepository.findByPublicId(publicId);

    if (!invoice) {
      throw new Error(`Invoice ${publicId} not found`);
    }

    // Only allow updates to draft invoices
    if (invoice.status !== "DRAFT") {
      throw new Error("Only draft invoices can be updated");
    }

    const customerId = data.customerId ?? invoice.customerId;

    // Validate customer if provided
    if (data.customerId) {
      await this.customerLookupRepository.findById(data.customerId);
    }

    let calculatedLines = invoice.lines;

    // If lines provided, recalculate
    if (data.lines) {
      calculatedLines = await Promise.all(
        data.lines.map(async (line) => {
          const item = await this.itemLookupRepository.findById(line.itemId);
          const taxRate = Number(item.taxRate);
          const calculated = this.calculator.calculateLine(
            line.quantity,
            line.rate,
            taxRate
          );

          return {
            itemId: line.itemId,
            quantity: this.calculator.toDecimal(calculated.quantity),
            rate: this.calculator.toDecimal(calculated.rate),
            taxRate: this.calculator.toDecimal(calculated.taxRate),
            lineSubtotal: this.calculator.toDecimal(calculated.subtotal),
            lineTax: this.calculator.toDecimal(calculated.tax),
            lineTotal: this.calculator.toDecimal(calculated.total),
          };
        })
      );
    }

    // Calculate totals
    const lineCalculations = calculatedLines.map((line) => ({
      quantity: Number(line.quantity),
      rate: Number(line.rate),
      taxRate: Number(line.taxRate),
      subtotal: Number(line.lineSubtotal),
      tax: Number(line.lineTax),
      total: Number(line.lineTotal),
    }));

    const totals = this.calculator.calculateTotals(lineCalculations);

    // Update invoice
    await this.invoiceRepository.update(invoice.id, {
      customerId,
      dueDate: data.dueDate !== undefined ? (data.dueDate ? new Date(data.dueDate) : null) : undefined,
      notes: data.notes,
      subtotal: this.calculator.toDecimal(totals.subtotal),
      totalTax: this.calculator.toDecimal(totals.totalTax),
      total: this.calculator.toDecimal(totals.total),
    });

    // Update lines if provided
    if (data.lines) {
      await this.invoiceRepository.replaceLines(invoice.id, calculatedLines);
    }
  }

  async updateInvoiceStatus(
    publicId: string,
    status: "DRAFT" | "SENT" | "PAID" | "CANCELLED"
  ): Promise<void> {
    const invoice = await this.invoiceRepository.findByPublicId(publicId);

    if (!invoice) {
      throw new Error(`Invoice ${publicId} not found`);
    }

    await this.invoiceRepository.updateStatus(invoice.id, status);
  }

  async listInvoices(options: {
    customerId?: number;
    status?: string;
    skip: number;
    take: number;
  }): Promise<{ items: InvoiceDTO[]; total: number }> {
    const [items, total] = await Promise.all([
      this.invoiceRepository.list(options),
      this.invoiceRepository.count({
        customerId: options.customerId,
        status: options.status,
      }),
    ]);

    return {
      items: items.map((item) => ({
        id: item.id,
        publicId: item.publicId,
        invoiceNumber: item.invoiceNumber,
        customerId: item.customerId,
        customerName: item.customer.name,
        status: item.status,
        subtotal: item.subtotal.toString(),
        totalTax: item.totalTax.toString(),
        total: item.total.toString(),
        notes: item.notes,
        dueDate: item.dueDate?.toISOString() ?? null,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        lines: [],
      })),
      total,
    };
  }

  private mapToDTO(invoice: any): InvoiceDTO {
    return {
      id: invoice.id,
      publicId: invoice.publicId,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
      customerName: invoice.customer.name,
      status: invoice.status,
      subtotal: invoice.subtotal.toString(),
      totalTax: invoice.totalTax.toString(),
      total: invoice.total.toString(),
      notes: invoice.notes,
      dueDate: invoice.dueDate?.toISOString() ?? null,
      createdAt: invoice.createdAt.toISOString(),
      updatedAt: invoice.updatedAt.toISOString(),
      lines: invoice.lines.map((line: any) => ({
        id: line.id,
        itemId: line.itemId,
        itemName: line.item.name,
        quantity: line.quantity.toString(),
        rate: line.rate.toString(),
        taxRate: line.taxRate.toString(),
        lineSubtotal: line.lineSubtotal.toString(),
        lineTax: line.lineTax.toString(),
        lineTotal: line.lineTotal.toString(),
      })),
    };
  }
}
