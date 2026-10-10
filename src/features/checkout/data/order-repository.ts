import { nullIfNotFound } from "@/core/http/api-error";
import type { HttpClient } from "@/core/http/http-client";
import type { Order, OrderItem } from "../domain/types";

export interface OrderRepository {
  /** Places an order; the same idempotency key always yields the same order. */
  place(items: OrderItem[], idempotencyKey: string): Promise<Order>;
  findById(id: string): Promise<Order | null>;
}

type OrderDto = Order & Record<string, unknown>;

const toOrder = ({ id, status, total, placedAt, paidAt, lines }: OrderDto): Order => ({
  id,
  status,
  total,
  placedAt,
  paidAt: paidAt ?? null,
  lines: lines.map(({ sku, productName, unitPrice, quantity, lineTotal }) => ({
    sku,
    productName,
    unitPrice,
    quantity,
    lineTotal,
  })),
});

export class ApiOrderRepository implements OrderRepository {
  constructor(private readonly http: HttpClient) {}

  async place(items: OrderItem[], idempotencyKey: string): Promise<Order> {
    const body = {
      lines: items.map((item) => ({ product: `/api/products/${item.productId}`, quantity: item.quantity })),
    };
    const dto = await this.http.post<OrderDto>("/orders", body, {
      headers: { "Idempotency-Key": idempotencyKey },
    });
    return toOrder(dto);
  }

  async findById(id: string): Promise<Order | null> {
    const dto = await nullIfNotFound(this.http.get<OrderDto>(`/orders/${encodeURIComponent(id)}`));
    return dto ? toOrder(dto) : null;
  }
}
