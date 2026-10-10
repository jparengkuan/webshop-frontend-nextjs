import { multiplyMoney, sumMoney, type Money } from "@/core/money";

/**
 * A snapshot of a product taken when it was added. It only drives the cart UI: when the order is
 * placed the API takes price and stock from its own database.
 */
export type CartLine = {
  productId: string;
  name: string;
  categorySlug: string;
  price: Money;
  quantity: number;
  maxQuantity: number;
};

export type CartProduct = Omit<CartLine, "quantity">;

/* Pure functions: every change returns a new array, which keeps the store and React simple. */

export function addToCart(lines: CartLine[], product: CartProduct, quantity = 1): CartLine[] {
  const existing = lines.find((line) => line.productId === product.productId);
  if (!existing) {
    return [...lines, { ...product, quantity: clamp(quantity, product.maxQuantity) }];
  }
  // Refresh the snapshot (price, stock) while adding to the quantity.
  return lines.map((line) =>
    line === existing ? { ...line, ...product, quantity: clamp(line.quantity + quantity, product.maxQuantity) } : line,
  );
}

/** Sets a line's quantity; zero or less removes the line. */
export function updateQuantity(lines: CartLine[], productId: string, quantity: number): CartLine[] {
  return lines.flatMap((line) => {
    if (line.productId !== productId) return [line];
    return quantity < 1 ? [] : [{ ...line, quantity: clamp(quantity, line.maxQuantity) }];
  });
}

export function removeFromCart(lines: CartLine[], productId: string): CartLine[] {
  return updateQuantity(lines, productId, 0);
}

export function countItems(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

export function lineTotal(line: CartLine): Money {
  return multiplyMoney(line.price, line.quantity);
}

export function cartTotal(lines: CartLine[]): Money | null {
  return sumMoney(lines.map(lineTotal));
}

/** Room left to add, given what's already in the cart. */
export function remainingStock(lines: CartLine[], productId: string, stock: number): number {
  const inCart = lines.find((line) => line.productId === productId)?.quantity ?? 0;
  return Math.max(0, stock - inCart);
}

function clamp(quantity: number, max: number): number {
  return Math.max(1, Math.min(Math.floor(quantity), max));
}
