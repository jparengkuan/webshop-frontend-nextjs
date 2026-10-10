"use client";

import { useSyncExternalStore } from "react";
import { countItems, type CartLine } from "../domain/cart";
import { LocalStorageCartStorage } from "../store/cart-storage";
import { createCartStore } from "../store/cart-store";

/** The app-wide cart. Storage is only touched on first read, so this is safe during server rendering. */
export const cartStore = createCartStore(new LocalStorageCartStorage("webshop-cart"));

export type UseCart = {
  lines: CartLine[];
  count: number;
  add: typeof cartStore.add;
  setQuantity: typeof cartStore.setQuantity;
  remove: typeof cartStore.remove;
  clear: typeof cartStore.clear;
};

export function useCart(): UseCart {
  const lines = useSyncExternalStore(cartStore.subscribe, cartStore.getSnapshot, cartStore.getServerSnapshot);

  return {
    lines,
    count: countItems(lines),
    add: cartStore.add,
    setQuantity: cartStore.setQuantity,
    remove: cartStore.remove,
    clear: cartStore.clear,
  };
}
