import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { isUuid } from "@/core/http/hydra";
import { container } from "@/server/container";
import type { Category, Product, ProductQuery } from "../domain/types";

/**
 * Cached read side of the catalog. The catalog is public and the same for everyone, so results
 * are cached for a few minutes and can be purged together through the "catalog" tag.
 */

export async function getCategories(): Promise<Category[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog");
  return container.catalog().listCategories();
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  return (await getCategories()).find((category) => category.slug === slug) ?? null;
}

export async function getProducts(query: ProductQuery) {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog");
  return container.catalog().listProducts(query);
}

export async function getProduct(id: string): Promise<Product | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog");
  return isUuid(id) ? container.catalog().findProduct(id) : null;
}
