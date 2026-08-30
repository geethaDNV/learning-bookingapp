import { Decimal } from "@prisma/client/runtime/library";
import {
  IInvoiceCalculator,
  LineCalculation,
  InvoiceTotals,
} from "../di/contracts.js";

/**
 * InvoiceCalculator: Implements the invoice calculation logic.
 * Handles tax calculations and total computations.
 */
export class InvoiceCalculator implements IInvoiceCalculator {
  /**
   * Calculate line-level amounts: subtotal, tax, and total
   */
  calculateLine(
    quantity: number,
    rate: number,
    taxRate: number
  ): LineCalculation {
    const subtotal = quantity * rate;
    const tax = (subtotal * taxRate) / 100;
    const total = subtotal + tax;

    return {
      quantity,
      rate,
      taxRate,
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }

  /**
   * Calculate invoice-level totals from line items
   */
  calculateTotals(lines: LineCalculation[]): InvoiceTotals {
    const subtotal = lines.reduce((sum, line) => sum + line.subtotal, 0);
    const totalTax = lines.reduce((sum, line) => sum + line.tax, 0);
    const total = subtotal + totalTax;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }

  /**
   * Convert number to Decimal for database storage
   */
  toDecimal(value: number): Decimal {
    return new Decimal(value.toFixed(2));
  }
}
