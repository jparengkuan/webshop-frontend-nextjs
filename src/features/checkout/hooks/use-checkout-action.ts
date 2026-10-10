"use client";

import { useState, useTransition } from "react";
import type { CheckoutResult } from "../checkout-service";
import type { CheckoutError } from "../domain/types";

/**
 * Runs a checkout server action and follows it to Stripe on success.
 * Shared by "Bestellen en betalen" and "Opnieuw betalen".
 */
export function useCheckoutAction() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<CheckoutError | null>(null);

  const run = (action: () => Promise<CheckoutResult>) =>
    startTransition(async () => {
      setError(null);
      const result = await action();
      if (result.ok) {
        // Stripe's hosted page lives on another site: a full navigation, not the router.
        window.location.assign(result.value.checkoutUrl);
      } else {
        setError(result.error);
      }
    });

  return { run, pending, error };
}
