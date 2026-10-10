import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { routes } from "@/config/routes";
import { formatMoney } from "@/core/money";
import { CheckoutSteps } from "@/features/checkout/components/checkout-steps";
import { RetryPayment } from "@/features/checkout/components/retry-payment";
import { getOrder } from "@/features/checkout/server/queries";
import { ButtonLink } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/feedback";

export const metadata: Metadata = { title: "Betaling geannuleerd" };

type Props = PageProps<"/checkout/cancelled">;

/** Stripe sends the customer here when they leave the payment page: /checkout/cancelled?order=… */
export default function PaymentCancelledPage({ searchParams }: Props) {
  return (
    <div className="mx-auto max-w-2xl">
      <CheckoutSteps current="Betalen" />
      <Suspense fallback={<Skeleton className="h-64" />}>
        <Cancelled searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Cancelled({ searchParams }: Pick<Props, "searchParams">) {
  const order = await getOrder((await searchParams).order);

  return (
    <Card className="p-8">
      <h1 className="text-3xl font-bold tracking-tight">Betaling geannuleerd</h1>

      {order?.status === "placed" ? (
        <>
          <p className="mt-2 text-stone-600">
            Je bestelling van {formatMoney(order.total)} staat nog voor je klaar. Je kunt binnen 30 minuten na het
            bestellen alsnog betalen; daarna vervalt de bestelling.
          </p>
          <div className="mt-6 flex flex-wrap items-start gap-3">
            <RetryPayment orderId={order.id} />
            <ButtonLink href={routes.cart()} variant="secondary">
              Terug naar winkelwagen
            </ButtonLink>
          </div>
        </>
      ) : order?.status === "paid" ? (
        <p className="mt-2 text-stone-600">
          Deze bestelling is toch al betaald.{" "}
          <Link href={routes.orderSuccess(order.id)} className="underline">
            Bekijk je bestelling
          </Link>
        </p>
      ) : (
        <>
          <p className="mt-2 text-stone-600">
            Deze bestelling kan niet meer worden betaald. Je winkelwagen is bewaard.
          </p>
          <ButtonLink href={routes.cart()} className="mt-6">
            Naar winkelwagen
          </ButtonLink>
        </>
      )}
    </Card>
  );
}
