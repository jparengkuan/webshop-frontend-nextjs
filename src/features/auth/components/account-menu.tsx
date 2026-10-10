import { routes } from "@/config/routes";
import { getCurrentCustomer } from "../server/session";

/** "Inloggen", or the customer's first name and a logout button. Render inside <Suspense>. */
export async function AccountMenu() {
  const customer = await getCurrentCustomer();

  if (!customer) {
    return (
      // A full page load: the login redirects to the API.
      <a href={routes.login()} className="text-sm font-medium text-stone-700 hover:text-stone-900">
        Inloggen
      </a>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="hidden text-stone-600 sm:inline">Hoi, {customer.firstName}</span>
      {/* POST only, so a link on another site can't log you out. */}
      <form action={routes.logout()} method="post">
        <button
          type="submit"
          className="font-medium text-stone-700 underline-offset-4 hover:text-stone-900 hover:underline"
        >
          Uitloggen
        </button>
      </form>
    </div>
  );
}
