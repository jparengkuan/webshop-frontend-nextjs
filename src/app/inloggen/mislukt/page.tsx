import type { Metadata } from "next";
import { routes } from "@/config/routes";
import { ButtonAnchor, ButtonLink } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";

export const metadata: Metadata = { title: "Inloggen mislukt" };

export default function LoginFailedPage() {
  return (
    <Card className="mx-auto max-w-md p-8 text-center">
      <h1 className="text-2xl font-bold tracking-tight">Inloggen is niet gelukt</h1>
      <p className="mt-3 text-stone-600">
        De inlogpoging is verlopen of afgebroken. Je winkelwagen is bewaard, probeer het gerust opnieuw.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <ButtonLink href={routes.cart()} variant="secondary">
          Naar winkelwagen
        </ButtonLink>
        <ButtonAnchor href={routes.login(routes.checkout())}>Opnieuw inloggen</ButtonAnchor>
      </div>
    </Card>
  );
}
