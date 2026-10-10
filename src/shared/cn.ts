/** Joins class names, skipping falsy ones: cn("a", condition && "b"). */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
