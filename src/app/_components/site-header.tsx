import Link from "next/link";
import { Suspense } from "react";
import { routes } from "@/config/routes";
import { AccountMenu } from "@/features/auth/components/account-menu";
import { CartButton } from "@/features/cart/components/cart-button";
import { CategoryNav } from "@/features/catalog/components/category-nav";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link href={routes.home()} className="text-xl font-bold tracking-tight">
          webshop<span className="text-amber-600">.</span>
        </Link>
        <div className="flex items-center gap-5">
          {/* Per-customer, so it streams in after the static header. */}
          <Suspense fallback={null}>
            <AccountMenu />
          </Suspense>
          <CartButton />
        </div>
      </div>
      <CategoryNav />
    </header>
  );
}
