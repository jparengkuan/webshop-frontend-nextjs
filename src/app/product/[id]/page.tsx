import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { routes } from "@/config/routes";
import { formatMoney } from "@/core/money";
import { AddToCart } from "@/features/cart/components/add-to-cart";
import { ProductImage } from "@/features/catalog/components/product-image";
import { isAvailable } from "@/features/catalog/domain/types";
import { getProduct } from "@/features/catalog/server/queries";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { Skeleton } from "@/shared/ui/feedback";

type Props = PageProps<"/product/[id]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct((await params).id);
  return { title: product?.name ?? "Product", description: product?.description ?? undefined };
}

export default function ProductPage({ params }: Props) {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <ProductDetail params={params} />
    </Suspense>
  );
}

async function ProductDetail({ params }: Pick<Props, "params">) {
  const product = await getProduct((await params).id);
  if (!product) notFound();

  const available = isAvailable(product);

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Home", href: routes.home() },
          { label: product.category.name, href: routes.category(product.category.slug) },
          { label: product.name },
        ]}
      />
      <div className="grid gap-10 md:grid-cols-2">
        <ProductImage name={product.name} categorySlug={product.category.slug} size="lg" className="rounded-2xl" />
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
            <p className="mt-1 text-sm text-stone-500">Artikelnummer {product.sku}</p>
          </div>
          <p className="text-3xl font-semibold">{formatMoney(product.price)}</p>
          {product.description ? <p className="leading-relaxed text-stone-700">{product.description}</p> : null}
          <p className="text-sm">
            {available ? (
              <span className="text-emerald-700">● Op voorraad ({product.stock})</span>
            ) : (
              <span className="text-stone-500">● Niet leverbaar</span>
            )}
          </p>
          <AddToCart
            available={available}
            product={{
              productId: product.id,
              name: product.name,
              categorySlug: product.category.slug,
              price: product.price,
              maxQuantity: Math.max(1, product.stock),
            }}
          />
        </div>
      </div>
    </div>
  );
}
