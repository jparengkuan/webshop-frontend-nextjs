"use client";

import { useEffect } from "react";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";

/** Last line of defence for unexpected errors, e.g. the API being unreachable. */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Card className="mx-auto max-w-md p-8 text-center">
      <h1 className="text-2xl font-bold tracking-tight">Er ging iets mis</h1>
      <p className="mt-3 text-stone-600">De winkel is even niet bereikbaar. Probeer het zo nog eens.</p>
      {error.digest ? <p className="mt-2 font-mono text-xs text-stone-400">Code: {error.digest}</p> : null}
      <Button onClick={reset} className="mt-6">
        Opnieuw proberen
      </Button>
    </Card>
  );
}
