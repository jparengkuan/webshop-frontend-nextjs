import type { Money } from "@/core/money";

export type OrderStatus = "placed" | "paid" | "expired";

export type OrderLine = {
  sku: string;
  productName: string;
  unitPrice: Money;
  quantity: number;
  lineTotal: Money;
};

export type Order = {
  id: string;
  status: OrderStatus;
  total: Money;
  placedAt: string;
  paidAt: string | null;
  lines: OrderLine[];
};

export type OrderItem = { productId: string; quantity: number };

/** Why checking out didn't work, so the UI can respond to each case. */
export type CheckoutError =
  | { kind: "unauthenticated"; message: string }
  | { kind: "rejected"; message: string }
  | { kind: "invalid"; message: string };

/** Short, readable order number for customers; the full UUID stays internal. */
export function orderNumber(order: Pick<Order, "id">): string {
  return order.id.slice(0, 8).toUpperCase();
}
