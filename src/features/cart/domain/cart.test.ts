import { describe, expect, it } from "vitest";
import {
  addToCart,
  cartTotal,
  countItems,
  remainingStock,
  removeFromCart,
  updateQuantity,
  type CartProduct,
} from "./cart";

const mug: CartProduct = {
  productId: "mug",
  name: "Mok",
  categorySlug: "mokken-flessen",
  price: { amount: 1295, currency: "EUR" },
  maxQuantity: 3,
};

describe("cart", () => {
  it("adds a new product as a line", () => {
    expect(addToCart([], mug, 2)).toEqual([{ ...mug, quantity: 2 }]);
  });

  it("adds to the quantity of an existing line, capped at the stock", () => {
    const lines = addToCart(addToCart([], mug, 2), mug, 5);
    expect(lines).toHaveLength(1);
    expect(lines[0]!.quantity).toBe(3);
  });

  it("refreshes the product snapshot when adding again", () => {
    const lines = addToCart(addToCart([], mug), { ...mug, price: { amount: 995, currency: "EUR" } });
    expect(lines[0]!.price.amount).toBe(995);
  });

  it("removes a line when its quantity drops below 1", () => {
    const lines = addToCart([], mug);
    expect(updateQuantity(lines, "mug", 0)).toEqual([]);
    expect(removeFromCart(lines, "mug")).toEqual([]);
  });

  it("does not mutate the original lines", () => {
    const lines = Object.freeze(addToCart([], mug)) as ReturnType<typeof addToCart>;
    expect(() => updateQuantity(lines, "mug", 2)).not.toThrow();
  });

  it("counts items and totals the cart", () => {
    const lines = addToCart(addToCart([], mug, 2), {
      ...mug,
      productId: "cup",
      price: { amount: 500, currency: "EUR" },
    });
    expect(countItems(lines)).toBe(3);
    expect(cartTotal(lines)).toEqual({ amount: 2 * 1295 + 500, currency: "EUR" });
    expect(cartTotal([])).toBeNull();
  });

  it("knows how many more can be added", () => {
    expect(remainingStock(addToCart([], mug, 2), "mug", 3)).toBe(1);
    expect(remainingStock([], "mug", 3)).toBe(3);
  });
});
