import { EmptyState, Skeleton } from "@/shared/ui/feedback";
import type { Product } from "../domain/types";
import { ProductCard } from "./product-card";

const grid = "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4";

export function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) return <EmptyState message="Geen producten gevonden." />;

  return (
    <div className={grid}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

export function ProductGridSkeleton() {
  return (
    <div className={grid}>
      {Array.from({ length: 8 }, (_, i) => (
        <Skeleton key={i} className="aspect-3/4 rounded-xl" />
      ))}
    </div>
  );
}
