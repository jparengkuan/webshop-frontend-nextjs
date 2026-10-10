import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { routes } from "@/config/routes";
import { container } from "@/server/container";
import type { Customer } from "../domain/types";

/** The logged-in customer, fetched once per request however many components ask. */
export const getCurrentCustomer = cache((): Promise<Customer | null> => container.customers().current());

/** For pages that need a login: the customer, or a redirect to the login that comes back here. */
export async function requireCustomer(returnTo: string): Promise<Customer> {
  const customer = await getCurrentCustomer();
  if (!customer) redirect(routes.login(returnTo));
  return customer;
}
