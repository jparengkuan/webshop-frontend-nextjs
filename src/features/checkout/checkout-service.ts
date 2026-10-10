import { ApiError, UnauthorizedError } from "@/core/http/api-error";
import { isUuid } from "@/core/http/hydra";
import { fail, ok, type Result } from "@/core/result";
import type { OrderRepository } from "./data/order-repository";
import type { PaymentGateway, PaymentSession } from "./data/payment-gateway";
import type { CheckoutError, Order, OrderItem } from "./domain/types";

export type CheckoutResult = Result<PaymentSession, CheckoutError>;

const SESSION_EXPIRED: CheckoutError = {
  kind: "unauthenticated",
  message: "Je sessie is verlopen. Log opnieuw in om af te rekenen.",
};

/**
 * The checkout use cases. Depends on interfaces only, so it's tested with fakes and doesn't care
 * whether orders and payments go through API Platform, Stripe or anything else.
 */
export class CheckoutService {
  constructor(
    private readonly orders: OrderRepository,
    private readonly payments: PaymentGateway,
  ) {}

  /** Places the order, then starts its payment. Retrying with the same key never orders twice. */
  async placeOrderAndPay(items: OrderItem[], idempotencyKey: string): Promise<CheckoutResult> {
    let order: Order;
    try {
      order = await this.orders.place(items, idempotencyKey);
    } catch (error) {
      return this.toFailure(error, "Je bestelling kon niet worden geplaatst.");
    }
    return this.pay(order.id);
  }

  /** A new payment attempt for an order whose earlier checkout was cancelled. */
  async pay(orderId: string): Promise<CheckoutResult> {
    if (!isUuid(orderId)) return fail({ kind: "invalid", message: "Onbekende bestelling." });
    try {
      return ok(await this.payments.startPayment(orderId));
    } catch (error) {
      return this.toFailure(error, "Betalen kon niet worden gestart.");
    }
  }

  /** The order, if it belongs to the logged-in customer. */
  async findOrder(orderId: string): Promise<Order | null> {
    if (!isUuid(orderId)) return null;
    try {
      return await this.orders.findById(orderId);
    } catch (error) {
      // Someone else's order (403) or no session: either way there's nothing to show.
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) return null;
      throw error;
    }
  }

  /** Expected failures become a result for the UI; anything else is a bug and keeps throwing. */
  private toFailure(error: unknown, fallback: string): CheckoutResult {
    if (error instanceof UnauthorizedError) return fail(SESSION_EXPIRED);
    if (error instanceof ApiError && error.isRejection) {
      return fail({ kind: "rejected", message: error.message || fallback });
    }
    throw error;
  }
}
