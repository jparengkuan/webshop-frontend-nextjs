import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/shared/cn";

type Variant = "primary" | "secondary" | "ghost";

const base =
  "inline-flex items-center justify-center rounded-lg px-6 py-3 font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  primary: "bg-stone-900 text-white hover:bg-stone-700 disabled:bg-stone-400",
  secondary: "border border-stone-300 bg-white text-stone-900 hover:bg-stone-100",
  ghost: "px-0 py-0 text-stone-700 underline-offset-4 hover:text-stone-900 hover:underline",
};

type StyleProps = { variant?: Variant; block?: boolean };

export function buttonClasses({ variant = "primary", block = false }: StyleProps = {}, className?: string) {
  return cn(base, variants[variant], block && "w-full", className);
}

export function Button({
  variant,
  block,
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> & StyleProps) {
  return <button type={type} className={buttonClasses({ variant, block }, className)} {...props} />;
}

/** Client-side navigation styled as a button. */
export function ButtonLink({ variant, block, className, ...props }: ComponentProps<typeof Link> & StyleProps) {
  return <Link className={buttonClasses({ variant, block }, className)} {...props} />;
}

/**
 * A full page load styled as a button, for routes that redirect to another site (the login)
 * and must therefore not be fetched by the client-side router.
 */
export function ButtonAnchor({ variant, block, className, ...props }: ComponentProps<"a"> & StyleProps) {
  return <a className={buttonClasses({ variant, block }, className)} {...props} />;
}
