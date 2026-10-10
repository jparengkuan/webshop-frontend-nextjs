"use client";

import Link from "next/link";
import { useState } from "react";
import { routes } from "@/config/routes";
import { formatMoney } from "@/core/money";
import type { Customer } from "@/features/auth/domain/types";
import { cartTotal, lineTotal } from "@/features/cart/domain/cart";
import { useCart } from "@/features/cart/hooks/use-cart";
import { ProductImage } from "@/features/catalog/components/product-image";
import { Button, ButtonLink } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { EmptyState } from "@/shared/ui/feedback";
import { placeOrderAndPay } from "../actions";
import { useCheckoutAction } from "../hooks/use-checkout-action";
import { CheckoutError } from "./checkout-error";

export function CheckoutForm({ customer }: { customer: Customer }) {
  const { lines } = useCart();
  const { run, pending, error } = useCheckoutAction();
  // One key per visit of this page: retrying after an error can't create a second order.
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const total = cartTotal(lines);

  if (!total) {
    return (
      <EmptyState
        message="Je winkelwagen is leeg, er valt nog niets af te rekenen."
        action={
          <ButtonLink href={routes.home()} variant="secondary">
            Verder winkelen
          </ButtonLink>
        }
      />
    );
  }

  const submit = () =>
    run(() =>
      placeOrderAndPay({
        items: lines.map(({ productId, quantity }) => ({ productId, quantity })),
        idempotencyKey,
      }),
    );

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="flex flex-col gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold">Je gegevens</h2>
          <p className="mt-3">
            {customer.firstName} {customer.lastName}
          </p>
          <p className="text-stone-600">{customer.email}</p>
          <p className="mt-3 text-sm text-stone-500">De factuur sturen we naar dit e-mailadres.</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between p-6 pb-2">
            <h2 className="text-lg font-semibold">Je bestelling</h2>
            <Link href={routes.cart()} className="text-sm underline">
              Wijzigen
            </Link>
          </div>
          <ul className="divide-y divide-stone-200">
            {lines.map((line) => (
              <li key={line.productId} className="flex items-center gap-4 px-6 py-4">
                <ProductImage
                  name={line.name}
                  categorySlug={line.categorySlug}
                  size="sm"
                  className="w-14 shrink-0 rounded-lg"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{line.name}</p>
                  <p className="text-sm text-stone-500">
                    {line.quantity} × {formatMoney(line.price)}
                  </p>
                </div>
                <p className="font-semibold">{formatMoney(lineTotal(line))}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="h-fit p-6 lg:sticky lg:top-32">
        <h2 className="text-lg font-semibold">Totaal</h2>
        <dl className="mt-4 flex justify-between border-t border-stone-200 pt-3 text-lg">
          <dt className="font-semibold">Te betalen</dt>
          <dd className="font-bold">{formatMoney(total)}</dd>
        </dl>

        {error ? <CheckoutError error={error} returnTo={routes.checkout()} /> : null}

        <Button onClick={submit} disabled={pending} block className="mt-6">
          {pending ? "Bezig met bestellen…" : "Bestellen en betalen"}
        </Button>
        <p className="mt-3 text-xs leading-relaxed text-stone-500">
          Je betaalt veilig via Stripe met iDEAL of creditcard. Prijs en voorraad worden bij het bestellen
          gecontroleerd; de artikelen blijven 30 minuten voor je gereserveerd.
        </p>
      </Card>
    </div>
  );
}
