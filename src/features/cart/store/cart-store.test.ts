import { describe, expect, it, vi } from "vitest";
import type { CartProduct } from "../domain/cart";
import { InMemoryCartStorage } from "./cart-storage";
import { createCartStore } from "./cart-store";

const bag: CartProduct = {
  productId: "bag",
  name: "Tas",
  categorySlug: "tassen",
  price: { amount: 2995, currency: "EUR" },
  maxQuantity: 10,
};

describe("cart store", () => {
  it("persists changes and notifies subscribers", () => {
    const storage = new InMemoryCartStorage();
    const store = createCartStore(storage);
    const listener = vi.fn();
    store.subscribe(listener);

    store.add(bag, 2);

    expect(listener).toHaveBeenCalledOnce();
    expect(storage.load()).toEqual([{ ...bag, quantity: 2 }]);
    expect(store.getSnapshot()).toBe(store.getSnapshot()); // stable between changes, as React requires
  });

  it("reads the stored cart lazily", () => {
    const store = createCartStore(new InMemoryCartStorage([{ ...bag, quantity: 1 }]));
    expect(store.getSnapshot()).toHaveLength(1);
    expect(store.getServerSnapshot()).toEqual([]);
  });

  it("stops notifying after unsubscribe and can be cleared", () => {
    const store = createCartStore(new InMemoryCartStorage());
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    unsubscribe();

    store.add(bag);
    store.clear();

    expect(listener).not.toHaveBeenCalled();
    expect(store.getSnapshot()).toEqual([]);
  });
});
