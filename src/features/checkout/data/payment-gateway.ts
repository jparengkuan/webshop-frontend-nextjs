import type { HttpClient } from "@/core/http/http-client";

export type PaymentSession = { checkoutUrl: string; expiresAt: string };

/** Starts paying an order. The API talks to Stripe; this app only redirects the customer. */
export interface PaymentGateway {
  startPayment(orderId: string): Promise<PaymentSession>;
}

export class ApiPaymentGateway implements PaymentGateway {
  constructor(private readonly http: HttpClient) {}

  async startPayment(orderId: string): Promise<PaymentSession> {
    const { checkoutUrl, expiresAt } = await this.http.post<PaymentSession>(
      `/orders/${encodeURIComponent(orderId)}/payment`,
    );
    return { checkoutUrl, expiresAt };
  }
}
