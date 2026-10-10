import { routes } from "@/config/routes";
import { ButtonLink } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";

export default function NotFound() {
  return (
    <Card className="mx-auto max-w-md p-8 text-center">
      <p className="text-sm font-semibold text-amber-600">404</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight">Pagina niet gevonden</h1>
      <p className="mt-3 text-stone-600">Deze pagina of dit product bestaat niet (meer).</p>
      <ButtonLink href={routes.home()} className="mt-6">
        Naar de winkel
      </ButtonLink>
    </Card>
  );
}
