/**
 * Utility functions
 */

export function generateMockProviderPaymentId(): string {
  return `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateMockProviderLinkId(): string {
  return `link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateMockHostedUrl(): string {
  return `http://localhost:3001/pay/mock/${Date.now()}`;
}
