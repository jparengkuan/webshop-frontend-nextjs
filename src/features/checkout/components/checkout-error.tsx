import { routes } from "@/config/routes";
import { Alert } from "@/shared/ui/feedback";
import type { CheckoutError as CheckoutErrorType } from "../domain/types";

export function CheckoutError({ error, returnTo }: { error: CheckoutErrorType; returnTo: string }) {
  return (
    <Alert className="mt-4">
      {error.message}
      {error.kind === "unauthenticated" ? (
        <a href={routes.login(returnTo)} className="mt-2 block font-medium underline">
          Opnieuw inloggen
        </a>
      ) : null}
    </Alert>
  );
}
