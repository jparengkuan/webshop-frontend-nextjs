import "server-only";
import { container } from "@/server/container";
import type { Order } from "../domain/types";

/** The order for the confirmation pages; null when it doesn't exist or isn't this customer's. */
export function getOrder(orderId: string | string[] | undefined): Promise<Order | null> {
  return typeof orderId === "string" ? container.checkout().findOrder(orderId) : Promise.resolve(null);
}
