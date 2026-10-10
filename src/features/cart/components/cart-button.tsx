"use client";

import Link from "next/link";
import { routes } from "@/config/routes";
import { useCart } from "../hooks/use-cart";

export function CartButton() {
  const { count } = useCart();

  return (
    <Link
      href={routes.cart()}
      aria-label={`Winkelwagen, ${count} artikelen`}
      className="flex items-center gap-2 rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
    >
      Winkelwagen
      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-xs text-stone-900">
        {count}
      </span>
    </Link>
  );
}
