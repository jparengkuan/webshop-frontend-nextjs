import { describe, expect, it, vi } from "vitest";
import { ApiError, UnauthorizedError } from "@/core/http/api-error";
import { CheckoutService } from "./checkout-service";
import type { OrderRepository } from "./data/order-repository";
import type { PaymentGateway } from "./data/payment-gateway";
import type { Order } from "./domain/types";

const ORDER_ID = "01a12351-e4ef-798e-85b1-18b114080412";
const KEY = "4f9d1c2e-8a7b-4c3d-9e1f-0a2b3c4d5e6f";

const order: Order = {
  id: ORDER_ID,
  status: "placed",
  total: { amount: 1000, currency: "EUR" },
  placedAt: "2026-10-10T00:00:00+00:00",
  paidAt: null,
  lines: [],
};

function setup({
  orders = {},
  payments = {},
}: { orders?: Partial<OrderRepository>; payments?: Partial<PaymentGateway> } = {}) {
  const orderRepository: OrderRepository = {
    place: vi.fn().mockResolvedValue(order),
    findById: vi.fn().mockResolvedValue(order),
    ...orders,
  };
  const paymentGateway: PaymentGateway = {
    startPayment: vi.fn().mockResolvedValue({ checkoutUrl: "https://checkout.stripe.test/x", expiresAt: "" }),
    ...payments,
  };
  return { service: new CheckoutService(orderRepository, paymentGateway), orderRepository, paymentGateway };
}

describe("CheckoutService", () => {
  it("places the order with the idempotency key, then starts its payment", async () => {
    const { service, orderRepository, paymentGateway } = setup();
    const items = [{ productId: "p", quantity: 2 }];

    const result = await service.placeOrderAndPay(items, KEY);

    expect(orderRepository.place).toHaveBeenCalledWith(items, KEY);
    expect(paymentGateway.startPayment).toHaveBeenCalledWith(ORDER_ID);
    expect(result).toEqual({ ok: true, value: { checkoutUrl: "https://checkout.stripe.test/x", expiresAt: "" } });
  });

  it("reports a rejected order (e.g. out of stock) without starting a payment", async () => {
    const { service, paymentGateway } = setup({
      orders: { place: vi.fn().mockRejectedValue(new ApiError(422, "Insufficient stock")) },
    });

    const result = await service.placeOrderAndPay([{ productId: "p", quantity: 99 }], KEY);

    expect(result).toEqual({ ok: false, error: { kind: "rejected", message: "Insufficient stock" } });
    expect(paymentGateway.startPayment).not.toHaveBeenCalled();
  });

  it("asks to log in again when the session expired", async () => {
    const { service } = setup({ payments: { startPayment: vi.fn().mockRejectedValue(new UnauthorizedError()) } });
    const result = await service.pay(ORDER_ID);
    expect(result.ok === false && result.error.kind).toBe("unauthenticated");
  });

  it("lets unexpected errors through", async () => {
    const { service } = setup({ orders: { place: vi.fn().mockRejectedValue(new ApiError(500, "boom")) } });
    await expect(service.placeOrderAndPay([{ productId: "p", quantity: 1 }], KEY)).rejects.toThrow("boom");
  });

  it("hides orders that aren't the customer's", async () => {
    const { service } = setup({ orders: { findById: vi.fn().mockRejectedValue(new ApiError(403, "Access Denied")) } });
    expect(await service.findOrder(ORDER_ID)).toBeNull();
    expect(await service.findOrder("not-a-uuid")).toBeNull();
  });
});
