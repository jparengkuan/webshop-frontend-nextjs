import { addToCart, removeFromCart, updateQuantity, type CartLine, type CartProduct } from "../domain/cart";
import type { CartStorage } from "./cart-storage";

export type CartStore = ReturnType<typeof createCartStore>;

const EMPTY: CartLine[] = [];

/**
 * Observable cart state shaped for React's useSyncExternalStore: components subscribe, actions
 * apply a pure domain function, persist the result and notify every subscriber.
 */
export function createCartStore(storage: CartStorage) {
  let lines: CartLine[] | null = null;
  const listeners = new Set<() => void>();

  const getSnapshot = (): CartLine[] => (lines ??= storage.load());

  const commit = (next: CartLine[]) => {
    lines = next;
    storage.save(next);
    listeners.forEach((listener) => listener());
  };

  return {
    getSnapshot,
    /** The server can't see the browser's cart: render empty, the client fills it in after hydration. */
    getServerSnapshot: (): CartLine[] => EMPTY,

    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      const stopWatching = storage.onExternalChange(() => {
        lines = null;
        listener();
      });
      return () => {
        listeners.delete(listener);
        stopWatching();
      };
    },

    add: (product: CartProduct, quantity = 1) => commit(addToCart(getSnapshot(), product, quantity)),
    setQuantity: (productId: string, quantity: number) => commit(updateQuantity(getSnapshot(), productId, quantity)),
    remove: (productId: string) => commit(removeFromCart(getSnapshot(), productId)),
    clear: () => commit([]),
  };
}
