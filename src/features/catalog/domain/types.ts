import type { Money } from "@/core/money";

export type Category = { id: string; name: string; slug: string };

export type Product = {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category: Category;
  price: Money;
  stock: number;
  active: boolean;
};

export type ProductQuery = { categorySlug?: string; page?: number };

export function isAvailable(product: Product): boolean {
  return product.active && product.stock > 0;
}

/** Below this many items, the shop tells customers stock is running low. */
export const LOW_STOCK_THRESHOLD = 5;
