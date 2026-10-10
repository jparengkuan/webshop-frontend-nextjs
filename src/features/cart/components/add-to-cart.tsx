"use client";

import { useEffect, useState } from "react";
import { Button } from "@/shared/ui/button";
import { remainingStock, type CartProduct } from "../domain/cart";
import { useCart } from "../hooks/use-cart";

type Props = { product: CartProduct; available: boolean };

export function AddToCart({ product, available }: Props) {
  const { add, lines } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (!justAdded) return;
    const timer = setTimeout(() => setJustAdded(false), 2000);
    return () => clearTimeout(timer);
  }, [justAdded]);

  if (!available) {
    return <p className="rounded-lg bg-stone-100 px-4 py-3 text-stone-600">Dit product is uitverkocht.</p>;
  }

  const remaining = remainingStock(lines, product.productId, product.maxQuantity);
  const inCart = product.maxQuantity - remaining;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3">
        <label className="sr-only" htmlFor="quantity">
          Aantal
        </label>
        <input
          id="quantity"
          type="number"
          min={1}
          max={Math.max(1, remaining)}
          value={quantity}
          onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
          className="w-20 rounded-lg border border-stone-300 px-3 py-3 text-center"
        />
        <Button
          className="flex-1"
          disabled={remaining < 1}
          onClick={() => {
            add(product, quantity);
            setJustAdded(true);
          }}
        >
          {justAdded ? "Toegevoegd ✓" : "In winkelwagen"}
        </Button>
      </div>
      {inCart > 0 ? (
        <p className="text-sm text-stone-500">
          {inCart} in je winkelwagen{remaining < 1 ? " — maximale voorraad bereikt" : ""}
        </p>
      ) : null}
    </div>
  );
}
