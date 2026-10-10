import type { Metadata } from "next";
import { Suspense } from "react";
import { routes } from "@/config/routes";
import { CheckoutSteps } from "@/features/checkout/components/checkout-steps";
import { ClearCartOnMount, RefreshWhilePending } from "@/features/checkout/components/order-effects";
import { OrderSummary } from "@/features/checkout/components/order-summary";
import type { OrderStatus } from "@/features/checkout/domain/types";
import { getOrder } from "@/features/checkout/server/queries";
import { ButtonLink } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { EmptyState, Skeleton } from "@/shared/ui/feedback";

export const metadata: Metadata = { title: "Bedankt voor je bestelling" };

type Props = PageProps<"/checkout/success">;

const messages: Record<OrderStatus, { title: string; body: string }> = {
  paid: {
    title: "Bedankt voor je bestelling!",
    body: "Je betaling is ontvangen. De factuur komt binnen enkele minuten in je mailbox.",
  },
  placed: {
    title: "Betaling wordt verwerkt…",
    body: "We wachten op de bevestiging van Stripe. Deze pagina ververst vanzelf.",
  },
  expired: {
    title: "Bestelling verlopen",
    body: "Deze bestelling is niet op tijd betaald en is vervallen. Neem contact op als je toch hebt betaald.",
  },
};

/** Stripe sends the customer here after paying: /checkout/success?order=…&session_id=… */
export default function OrderSuccessPage({ searchParams }: Props) {
  return (
    <div className="mx-auto max-w-2xl">
      <Suspense fallback={<Skeleton className="h-64" />}>
        <OrderConfirmation searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function OrderConfirmation({ searchParams }: Pick<Props, "searchParams">) {
  const order = await getOrder((await searchParams).order);
  if (!order) {
    return (
      <EmptyState
        message="Deze bestelling hebben we niet gevonden."
        action={<ButtonLink href={routes.home()}>Naar de winkel</ButtonLink>}
      />
    );
  }

  const { title, body } = messages[order.status];

  return (
    <>
      <CheckoutSteps current={order.status === "paid" ? "Klaar" : "Betalen"} />
      <ClearCartOnMount />
      {order.status === "placed" ? <RefreshWhilePending /> : null}

      <Card className="p-8">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-stone-600">{body}</p>
        <OrderSummary order={order} />
        <ButtonLink href={routes.home()} className="mt-8">
          Verder winkelen
        </ButtonLink>
      </Card>
    </>
  );
}
