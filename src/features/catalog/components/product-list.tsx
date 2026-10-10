import { Pagination } from "@/shared/ui/pagination";
import type { ProductQuery } from "../domain/types";
import { getProducts } from "../server/queries";
import { ProductGrid } from "./product-grid";

type Props = ProductQuery & {
  hrefForPage: (page: number) => string;
  showCount?: boolean;
};

/** A page of products with pagination; render inside <Suspense> with <ProductGridSkeleton />. */
export async function ProductList({ categorySlug, page = 1, hrefForPage, showCount = false }: Props) {
  const { items, totalItems, totalPages } = await getProducts({ categorySlug, page });

  return (
    <>
      {showCount ? <p className="mb-4 text-sm text-stone-500">{totalItems} producten</p> : null}
      <ProductGrid products={items} />
      <Pagination page={page} totalPages={totalPages} hrefForPage={hrefForPage} />
    </>
  );
}
