import Link from "next/link";
import { routes } from "@/config/routes";
import { getCategories } from "../server/queries";
import { ProductImage } from "./product-image";

export async function CategoryNav() {
  const categories = await getCategories();

  return (
    <nav
      aria-label="Categorieën"
      className="mx-auto flex max-w-6xl gap-6 overflow-x-auto px-4 pb-3 text-sm text-stone-600"
    >
      {categories.map((category) => (
        <Link
          key={category.id}
          href={routes.category(category.slug)}
          className="whitespace-nowrap hover:text-stone-900"
        >
          {category.name}
        </Link>
      ))}
    </nav>
  );
}

export async function CategoryTiles() {
  const categories = await getCategories();

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {categories.map((category) => (
        <Link
          key={category.id}
          href={routes.category(category.slug)}
          className="group overflow-hidden rounded-xl border border-stone-200 bg-white"
        >
          <ProductImage name={category.name} categorySlug={category.slug} className="aspect-4/3!" />
          <p className="p-3 text-center text-sm font-medium group-hover:underline">{category.name}</p>
        </Link>
      ))}
    </div>
  );
}
