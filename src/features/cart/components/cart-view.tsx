"use client";

import Link from "next/link";
import { routes } from "@/config/routes";
import { formatMoney } from "@/core/money";
import { ProductImage } from "@/features/catalog/components/product-image";
import { ButtonAnchor, ButtonLink } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { EmptyState } from "@/shared/ui/feedback";
import { cartTotal, lineTotal } from "../domain/cart";
import { useCart } from "../hooks/use-cart";
import { QuantityStepper } from "./quantity-stepper";

export function CartView() {
  const { lines, setQuantity, remove } = useCart();
  const total = cartTotal(lines);

  if (!total) {
    return (
      <EmptyState
        message="Je winkelwagen is leeg."
        action={
          <ButtonLink href={routes.home()} variant="secondary">
            Verder winkelen
          </ButtonLink>
        }
      />
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <Card>
        <ul className="divide-y divide-stone-200">
          {lines.map((line) => (
            <li key={line.productId} className="flex flex-wrap items-center gap-4 p-4 sm:flex-nowrap">
              <ProductImage
                name={line.name}
                categorySlug={line.categorySlug}
                size="sm"
                className="w-20 shrink-0 rounded-lg"
              />
              <div className="min-w-0 flex-1">
                <Link href={routes.product(line.productId)} className="font-medium hover:underline">
                  {line.name}
                </Link>
                <p className="text-sm text-stone-500">{formatMoney(line.price)} per stuk</p>
                <button
                  type="button"
                  onClick={() => remove(line.productId)}
                  className="mt-1 text-sm text-stone-500 underline hover:text-red-700"
                >
                  Verwijderen
                </button>
              </div>
              <QuantityStepper
                quantity={line.quantity}
                max={line.maxQuantity}
                onChange={(quantity) => setQuantity(line.productId, quantity)}
              />
              <p className="w-24 text-right font-semibold">{formatMoney(lineTotal(line))}</p>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="h-fit p-6">
        <h2 className="text-lg font-semibold">Overzicht</h2>
        <dl className="mt-4 flex justify-between text-lg">
          <dt>Totaal</dt>
          <dd className="font-bold">{formatMoney(total)}</dd>
        </dl>
        {/* A full page load: the login redirect to the API must happen in the browser itself. */}
        <ButtonAnchor href={routes.checkout()} block className="mt-6">
          Afrekenen
        </ButtonAnchor>
        <p className="mt-2 text-xs text-stone-500">
          Je logt eerst in met je account; daarna controleer je je bestelling en betaal je via Stripe.
        </p>
      </Card>
    </div>
  );
}
