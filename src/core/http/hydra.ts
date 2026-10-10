/** A JSON-LD (Hydra) collection as API Platform returns it. */
export type HydraCollection<T> = { member: T[]; totalItems: number };

export type Paginated<T> = {
  items: T[];
  page: number;
  totalItems: number;
  totalPages: number;
};

export function toPaginated<T, U>(
  collection: HydraCollection<T>,
  map: (item: T) => U,
  page: number,
  pageSize: number,
): Paginated<U> {
  return {
    items: collection.member.map(map),
    page,
    totalItems: collection.totalItems,
    totalPages: Math.max(1, Math.ceil(collection.totalItems / pageSize)),
  };
}

/** Reads ?page= safely: anything that isn't a positive whole number means page 1. */
export function parsePageParam(value: string | string[] | undefined): number {
  const page = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}
