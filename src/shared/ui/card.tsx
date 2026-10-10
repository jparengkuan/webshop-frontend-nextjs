import type { ComponentProps } from "react";
import { cn } from "@/shared/cn";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-2xl border border-stone-200 bg-white", className)} {...props} />;
}
