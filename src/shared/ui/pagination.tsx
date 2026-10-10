import Link from "next/link";
import { buttonClasses } from "./button";

type Props = {
  page: number;
  totalPages: number;
  hrefForPage: (page: number) => string;
};

export function Pagination({ page, totalPages, hrefForPage }: Props) {
  if (totalPages <= 1) return null;

  return (
    <nav className="mt-10 flex items-center justify-center gap-3" aria-label="Paginering">
      {page > 1 ? (
        <Link className={buttonClasses({ variant: "secondary" }, "px-4 py-2 text-sm")} href={hrefForPage(page - 1)}>
          ← Vorige
        </Link>
      ) : null}
      <span className="text-sm text-stone-600">
        Pagina {page} van {totalPages}
      </span>
      {page < totalPages ? (
        <Link className={buttonClasses({ variant: "secondary" }, "px-4 py-2 text-sm")} href={hrefForPage(page + 1)}>
          Volgende →
        </Link>
      ) : null}
    </nav>
  );
}
