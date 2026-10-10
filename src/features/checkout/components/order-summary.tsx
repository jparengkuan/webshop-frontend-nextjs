import { site } from "@/config/site";
import { formatMoney } from "@/core/money";
import { orderNumber, type Order } from "../domain/types";

export function OrderSummary({ order }: { order: Order }) {
  return (
    <>
      <dl className="mt-6 grid grid-cols-2 gap-4 rounded-xl bg-stone-50 p-4 text-sm">
        <div>
          <dt className="text-stone-500">Bestelnummer</dt>
          <dd className="font-mono">{orderNumber(order)}</dd>
        </div>
        <div>
          <dt className="text-stone-500">Besteld op</dt>
          <dd>{new Date(order.placedAt).toLocaleString(site.locale, { dateStyle: "long", timeStyle: "short" })}</dd>
        </div>
      </dl>

      <ul className="mt-6 divide-y divide-stone-200">
        {order.lines.map((line) => (
          <li key={line.sku} className="flex justify-between py-3 text-sm">
            <span>
              {line.quantity} × {line.productName}
            </span>
            <span className="font-medium">{formatMoney(line.lineTotal)}</span>
          </li>
        ))}
      </ul>
      <p className="flex justify-between border-t border-stone-200 pt-4 text-lg font-bold">
        <span>Totaal</span>
        <span>{formatMoney(order.total)}</span>
      </p>
    </>
  );
}
