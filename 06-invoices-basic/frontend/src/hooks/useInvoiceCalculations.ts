import { useCallback } from "react";
import type { LineCalculation, InvoiceTotalsDisplay } from "../types/index.js";

/**
 * Hook for invoice calculations on the client side
 */
export function useInvoiceCalculations() {
  const calculateLine = useCallback(
    (
      quantity: number | string,
      rate: number | string,
      taxRate: number | string
    ): LineCalculation => {
      const q = Number(quantity) || 0;
      const r = Number(rate) || 0;
      const t = Number(taxRate) || 0;

      const subtotal = q * r;
      const tax = (subtotal * t) / 100;
      const total = subtotal + tax;

      return {
        quantity: q,
        rate: r,
        taxRate: t,
        subtotal: Math.round(subtotal * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        total: Math.round(total * 100) / 100,
      };
    },
    []
  );

  const calculateTotals = useCallback(
    (lines: LineCalculation[]): InvoiceTotalsDisplay => {
      const subtotal = lines.reduce((sum, line) => sum + line.subtotal, 0);
      const totalTax = lines.reduce((sum, line) => sum + line.tax, 0);
      const total = subtotal + totalTax;

      return {
        subtotal: Math.round(subtotal * 100) / 100,
        totalTax: Math.round(totalTax * 100) / 100,
        total: Math.round(total * 100) / 100,
      };
    },
    []
  );

  return { calculateLine, calculateTotals };
}

/**
 * Type definitions for calculations
 */
export interface LineCalculation {
  quantity: number;
  rate: number;
  taxRate: number;
  subtotal: number;
  tax: number;
  total: number;
}

export interface InvoiceTotalsDisplay {
  subtotal: number;
  totalTax: number;
  total: number;
}
