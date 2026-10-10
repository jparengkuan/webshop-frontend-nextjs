export type Violation = { propertyPath: string; message: string };

/** A non-2xx answer from the API, carrying its RFC 7807 problem details. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly violations: Violation[] = [],
  ) {
    super(message);
    this.name = "ApiError";
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  /** The API refused on business grounds (stock, payment window, validation), not a bug. */
  get isRejection(): boolean {
    return this.status === 409 || this.status === 422;
  }
}

/** No access token, or the API rejected it. */
export class UnauthorizedError extends ApiError {
  constructor(message = "Not logged in") {
    super(401, message);
    this.name = "UnauthorizedError";
  }
}

type ProblemDetails = {
  detail?: string;
  description?: string;
  title?: string;
  violations?: Violation[];
};

export async function toApiError(response: Response): Promise<ApiError> {
  if (response.status === 401) return new UnauthorizedError();

  let problem: ProblemDetails = {};
  try {
    problem = await response.json();
  } catch {
    // Not JSON (e.g. a proxy error page): fall back to the status text.
  }
  const message = problem.detail ?? problem.description ?? problem.title ?? `${response.status} ${response.statusText}`;
  return new ApiError(response.status, message, problem.violations ?? []);
}

/** Turns a 404 into null, so "doesn't exist" is a value rather than an exception. */
export async function nullIfNotFound<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) return null;
    throw error;
  }
}
