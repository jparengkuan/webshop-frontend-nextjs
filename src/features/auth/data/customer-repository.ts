import { UnauthorizedError } from "@/core/http/api-error";
import type { HttpClient } from "@/core/http/http-client";
import type { Customer } from "../domain/types";

export interface CustomerRepository {
  /** The logged-in customer, or null when nobody is logged in. */
  current(): Promise<Customer | null>;
}

type CustomerDto = Customer & Record<string, unknown>;

export class ApiCustomerRepository implements CustomerRepository {
  constructor(private readonly http: HttpClient) {}

  async current(): Promise<Customer | null> {
    try {
      const { id, email, firstName, lastName } = await this.http.get<CustomerDto>("/me");
      return { id, email, firstName, lastName };
    } catch (error) {
      if (error instanceof UnauthorizedError) return null;
      throw error;
    }
  }
}
