import Link from "next/link";
import { routes } from "@/config/routes";
import { formatMoney } from "@/core/money";
import { isAvailable, LOW_STOCK_THRESHOLD, type Product } from "../domain/types";
import { ProductImage } from "./product-image";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={routes.product(product.id)}
      className="group flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <ProductImage name={product.name} categorySlug={product.category.slug} />
      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="text-xs tracking-wide text-stone-500 uppercase">{product.category.name}</p>
        <h3 className="font-medium text-stone-900">{product.name}</h3>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="font-semibold">{formatMoney(product.price)}</span>
          <StockHint product={product} />
        </div>
      </div>
    </Link>
  );
}

function StockHint({ product }: { product: Product }) {
  if (!isAvailable(product)) return <span className="text-xs text-stone-500">Uitverkocht</span>;
  if (product.stock <= LOW_STOCK_THRESHOLD) {
    return <span className="text-xs text-amber-700">Nog {product.stock} op voorraad</span>;
  }
  return null;
}
