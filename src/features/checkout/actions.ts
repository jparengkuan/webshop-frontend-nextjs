"use server";

import { z } from "zod";
import { fail } from "@/core/result";
import { container } from "@/server/container";
import type { CheckoutResult } from "./checkout-service";

/*
 * Server actions are public HTTP endpoints: validate every argument, whatever the UI sends.
 * Next.js only accepts them from this app's own origin (Origin must match Host).
 */

const placeOrderSchema = z.object({
  items: z
    .array(z.object({ productId: z.uuid(), quantity: z.number().int().min(1).max(100) }))
    .min(1)
    .max(50),
  idempotencyKey: z.uuid(),
});

const INVALID_CART = "Je winkelwagen is ongeldig. Ververs de pagina en probeer het opnieuw.";

export async function placeOrderAndPay(input: z.input<typeof placeOrderSchema>): Promise<CheckoutResult> {
  const parsed = placeOrderSchema.safeParse(input);
  if (!parsed.success) return fail({ kind: "invalid", message: INVALID_CART });

  return container.checkout().placeOrderAndPay(parsed.data.items, parsed.data.idempotencyKey);
}

export async function retryPayment(orderId: string): Promise<CheckoutResult> {
  const parsed = z.uuid().safeParse(orderId);
  if (!parsed.success) return fail({ kind: "invalid", message: "Onbekende bestelling." });

  return container.checkout().pay(parsed.data);
}
