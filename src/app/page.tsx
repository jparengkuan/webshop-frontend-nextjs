import { Suspense } from "react";
import { routes } from "@/config/routes";
import { parsePageParam } from "@/core/http/hydra";
import { CategoryTiles } from "@/features/catalog/components/category-nav";
import { ProductGridSkeleton } from "@/features/catalog/components/product-grid";
import { ProductList } from "@/features/catalog/components/product-list";

export default function HomePage({ searchParams }: PageProps<"/">) {
  return (
    <div className="flex flex-col gap-12">
      <section className="rounded-2xl bg-stone-900 px-8 py-14 text-white">
        <p className="text-sm tracking-widest text-amber-400 uppercase">Nieuwe collectie</p>
        <h1 className="mt-2 max-w-xl text-4xl font-bold tracking-tight sm:text-5xl">
          Alles voor onderweg, op kantoor en thuis.
        </h1>
        <p className="mt-4 max-w-lg text-stone-300">Ontdek hoodies, tassen, mokken, audio en meer.</p>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Categorieën</h2>
        <CategoryTiles />
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Alle producten</h2>
        <Suspense fallback={<ProductGridSkeleton />}>
          <AllProducts searchParams={searchParams} />
        </Suspense>
      </section>
    </div>
  );
}

async function AllProducts({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const page = parsePageParam((await searchParams).page);
  return <ProductList page={page} hrefForPage={(p) => routes.home(p)} />;
}
