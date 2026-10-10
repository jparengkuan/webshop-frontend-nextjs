import { cn } from "@/shared/cn";

/** The API has no product images yet, so each category gets its own coloured placeholder. */
const palettes: Record<string, string> = {
  accessoires: "from-amber-100 to-amber-200 text-amber-900",
  audio: "from-sky-100 to-sky-200 text-sky-900",
  kantoor: "from-stone-100 to-stone-200 text-stone-800",
  kleding: "from-rose-100 to-rose-200 text-rose-900",
  "mokken-flessen": "from-teal-100 to-teal-200 text-teal-900",
  tassen: "from-violet-100 to-violet-200 text-violet-900",
};
const fallback = "from-emerald-100 to-emerald-200 text-emerald-900";

const sizes = { sm: "text-sm", md: "text-3xl", lg: "text-6xl" } as const;

type Props = {
  name: string;
  categorySlug: string;
  size?: keyof typeof sizes;
  className?: string;
};

export function ProductImage({ name, categorySlug, size = "md", className }: Props) {
  return (
    <div
      aria-hidden
      className={cn(
        "flex aspect-square items-center justify-center bg-linear-to-br font-semibold tracking-wide",
        palettes[categorySlug] ?? fallback,
        className,
      )}
    >
      <span className={cn("opacity-70", sizes[size])}>{initials(name)}</span>
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(/[\s,&]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join("");
}
