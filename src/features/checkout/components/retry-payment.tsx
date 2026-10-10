"use client";

import { routes } from "@/config/routes";
import { Button } from "@/shared/ui/button";
import { retryPayment } from "../actions";
import { useCheckoutAction } from "../hooks/use-checkout-action";
import { CheckoutError } from "./checkout-error";

export function RetryPayment({ orderId }: { orderId: string }) {
  const { run, pending, error } = useCheckoutAction();

  return (
    <div>
      <Button disabled={pending} onClick={() => run(() => retryPayment(orderId))}>
        {pending ? "Even geduld…" : "Opnieuw betalen"}
      </Button>
      {error ? <CheckoutError error={error} returnTo={routes.orderCancelled(orderId)} /> : null}
    </div>
  );
}
