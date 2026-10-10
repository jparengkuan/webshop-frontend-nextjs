import { cn } from "@/shared/cn";

export const CHECKOUT_STEPS = ["Winkelwagen", "Inloggen", "Controleren", "Betalen"] as const;
export type CheckoutStep = (typeof CHECKOUT_STEPS)[number] | "Klaar";

/** Progress bar for the checkout; steps before `current` show as done. */
export function CheckoutSteps({ current }: { current: CheckoutStep }) {
  const currentIndex = current === "Klaar" ? CHECKOUT_STEPS.length : CHECKOUT_STEPS.indexOf(current);

  return (
    <ol className="mb-8 flex items-center gap-2 text-sm" aria-label="Stappen van het afrekenen">
      {CHECKOUT_STEPS.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <li key={step} className="flex flex-1 items-center gap-2" aria-current={active ? "step" : undefined}>
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                done && "bg-emerald-600 text-white",
                active && "bg-stone-900 text-white",
                !done && !active && "bg-stone-200 text-stone-500",
              )}
            >
              {done ? "✓" : i + 1}
            </span>
            <span className={cn("hidden sm:inline", active ? "font-semibold" : "text-stone-500")}>{step}</span>
            {i < CHECKOUT_STEPS.length - 1 ? <span className="h-px flex-1 bg-stone-300" /> : null}
          </li>
        );
      })}
    </ol>
  );
}
