import { v4 as uuidv4 } from "uuid";
import { IPaymentGatewayProvider } from "../di/contracts.js";

/**
 * Mock payment gateway provider for learning purposes
 * In production, this would call Razorpay API
 */
export class MockPaymentGatewayProvider implements IPaymentGatewayProvider {
  async createPaymentIntent(
    paymentId: string,
    amount: number,
    description: string
  ): Promise<{ providerPaymentId: string; paymentLink: string }> {
    // Generate a mock provider payment ID
    const providerPaymentId = `mock_pay_${uuidv4()}`;

    // In production with Razorpay, this would return a real payment link
    // Here we return a mock URL that includes the payment ID
    const paymentLink = `http://localhost:3001/api/v1/payments/public/status/${paymentId}`;

    return { providerPaymentId, paymentLink };
  }

  async getPaymentStatus(providerPaymentId: string): Promise<string> {
    // In production, this would query the provider API
    // For learning, we'll just return the current status from our DB
    // (called by webhook service or polling logic)
    return "pending";
  }
}
