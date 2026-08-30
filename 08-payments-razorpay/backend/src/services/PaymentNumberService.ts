import { IPaymentNumberService } from "../di/contracts.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Generates unique public payment IDs for status pages
 */
export class PaymentNumberService implements IPaymentNumberService {
  async generatePublicId(): Promise<string> {
    // Generate a public-friendly ID (short UUID-like string)
    // In production, could use something like nanoid
    return `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
