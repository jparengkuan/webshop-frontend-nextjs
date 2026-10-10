import { z } from "zod";
import type { CartLine } from "../domain/cart";

/** Where the cart is kept; swap the strategy (memory in tests, an API later) without touching the store. */
export interface CartStorage {
  load(): CartLine[];
  save(lines: CartLine[]): void;
  /** Calls back when the cart changed outside this page, e.g. in another tab. */
  onExternalChange(callback: () => void): () => void;
}

const cartSchema = z.array(
  z.object({
    productId: z.string(),
    name: z.string(),
    categorySlug: z.string(),
    price: z.object({ amount: z.number().int().nonnegative(), currency: z.string().length(3) }),
    quantity: z.number().int().positive(),
    maxQuantity: z.number().int().positive(),
  }),
);

/** Browser storage. Every access is guarded: storage can be full, blocked or tampered with. */
export class LocalStorageCartStorage implements CartStorage {
  constructor(private readonly key: string) {}

  load(): CartLine[] {
    try {
      const parsed = cartSchema.safeParse(JSON.parse(localStorage.getItem(this.key) ?? "[]"));
      return parsed.success ? parsed.data : [];
    } catch {
      return [];
    }
  }

  save(lines: CartLine[]): void {
    try {
      localStorage.setItem(this.key, JSON.stringify(lines));
    } catch {
      // Blocked or full: the cart still works until the page is reloaded.
    }
  }

  onExternalChange(callback: () => void): () => void {
    const listener = (event: StorageEvent) => {
      if (event.key === this.key) callback();
    };
    window.addEventListener("storage", listener);
    return () => window.removeEventListener("storage", listener);
  }
}

export class InMemoryCartStorage implements CartStorage {
  constructor(private lines: CartLine[] = []) {}

  load(): CartLine[] {
    return this.lines;
  }

  save(lines: CartLine[]): void {
    this.lines = lines;
  }

  onExternalChange(): () => void {
    return () => {};
  }
}
