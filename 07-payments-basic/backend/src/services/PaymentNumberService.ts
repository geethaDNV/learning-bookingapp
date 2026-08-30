import { v4 as uuidv4 } from "uuid";
import { IPaymentNumberService } from "../di/contracts.js";

export class PaymentNumberService implements IPaymentNumberService {
  async generatePublicId(): Promise<string> {
    // Generate a short, user-friendly public ID
    // Format: PAY-{timestamp}-{random}
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `PAY-${timestamp}-${random}`;
  }
}
