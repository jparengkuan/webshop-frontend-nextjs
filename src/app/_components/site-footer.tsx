import { site } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-stone-200 py-6 text-center text-sm text-stone-500">
      {site.name} · demo-frontend voor de API Platform-backend
    </footer>
  );
}
