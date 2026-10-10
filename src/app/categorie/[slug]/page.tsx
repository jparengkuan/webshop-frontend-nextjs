import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { routes } from "@/config/routes";
import { parsePageParam } from "@/core/http/hydra";
import { ProductGridSkeleton } from "@/features/catalog/components/product-grid";
import { ProductList } from "@/features/catalog/components/product-list";
import { getCategories, getCategoryBySlug } from "@/features/catalog/server/queries";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { PageTitle } from "@/shared/ui/feedback";

type Props = PageProps<"/categorie/[slug]">;

export async function generateStaticParams() {
  return (await getCategories()).map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await getCategoryBySlug((await params).slug);
  return { title: category?.name ?? "Categorie" };
}

export default function CategoryPage(props: Props) {
  return (
    <Suspense fallback={<ProductGridSkeleton />}>
      <Category {...props} />
    </Suspense>
  );
}

async function Category({ params, searchParams }: Props) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const page = parsePageParam((await searchParams).page);

  return (
    <div>
      <Breadcrumbs items={[{ label: "Home", href: routes.home() }, { label: category.name }]} />
      <PageTitle>{category.name}</PageTitle>
      <ProductList categorySlug={slug} page={page} showCount hrefForPage={(p) => routes.category(slug, p)} />
    </div>
  );
}
