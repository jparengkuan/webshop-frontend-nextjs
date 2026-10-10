import type { Metadata } from "next";
import { CartView } from "@/features/cart/components/cart-view";
import { PageTitle } from "@/shared/ui/feedback";

export const metadata: Metadata = { title: "Winkelwagen" };

export default function CartPage() {
  return (
    <div>
      <PageTitle>Winkelwagen</PageTitle>
      <CartView />
    </div>
  );
}
