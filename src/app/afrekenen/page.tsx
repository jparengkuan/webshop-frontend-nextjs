import type { Metadata } from "next";
import { Suspense } from "react";
import { routes } from "@/config/routes";
import { requireCustomer } from "@/features/auth/server/session";
import { CheckoutForm } from "@/features/checkout/components/checkout-form";
import { CheckoutSteps } from "@/features/checkout/components/checkout-steps";
import { PageTitle, Skeleton } from "@/shared/ui/feedback";

export const metadata: Metadata = { title: "Afrekenen" };

export default function CheckoutPage() {
  return (
    <div>
      <PageTitle>Afrekenen</PageTitle>
      <CheckoutSteps current="Controleren" />
      <Suspense fallback={<Skeleton className="h-64" />}>
        <Checkout />
      </Suspense>
    </div>
  );
}

async function Checkout() {
  // The proxy already sends visitors without a session to the login; this covers a rejected token.
  const customer = await requireCustomer(routes.checkout());
  return <CheckoutForm customer={customer} />;
}
