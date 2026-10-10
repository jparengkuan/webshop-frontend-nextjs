import type { ReactNode } from "react";
import { cn } from "@/shared/cn";

export function Alert({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div role="alert" className={cn("rounded-lg bg-red-50 p-3 text-sm text-red-800", className)}>
      {children}
    </div>
  );
}

export function EmptyState({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 px-4 py-16 text-center">
      <p className="text-stone-500">{message}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-2xl bg-stone-200", className)} />;
}

export function PageTitle({ children, subtitle }: { children: ReactNode; subtitle?: ReactNode }) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold tracking-tight">{children}</h1>
      {subtitle ? <p className="mt-1 text-sm text-stone-500">{subtitle}</p> : null}
    </div>
  );
}
