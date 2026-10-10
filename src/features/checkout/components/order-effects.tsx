"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { cartStore } from "@/features/cart/hooks/use-cart";

/** The order exists, so the cart's job is done, even while the payment is still being confirmed. */
export function ClearCartOnMount() {
  useEffect(() => cartStore.clear(), []);
  return null;
}

const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 20;

/** Stripe's webhook can arrive a moment after the customer does: re-check the order for a minute. */
export function RefreshWhilePending() {
  const router = useRouter();

  useEffect(() => {
    let polls = 0;
    const timer = setInterval(() => {
      if (++polls >= MAX_POLLS) clearInterval(timer);
      router.refresh();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [router]);

  return null;
}
