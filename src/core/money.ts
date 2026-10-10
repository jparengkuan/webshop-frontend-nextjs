import { site } from "@/config/site";

/** An amount in minor units (cents), as the API sends it: 1250 is € 12,50. */
export type Money = { amount: number; currency: string };

export function multiplyMoney(money: Money, factor: number): Money {
  return { amount: money.amount * factor, currency: money.currency };
}

/** Sums amounts of one currency; throws on a mix, which the API never accepts in one order. */
export function sumMoney(amounts: Money[]): Money | null {
  if (amounts.length === 0) return null;
  const currency = amounts[0]!.currency;
  if (amounts.some((money) => money.currency !== currency)) {
    throw new Error("Cannot add amounts in different currencies.");
  }
  return { amount: amounts.reduce((sum, money) => sum + money.amount, 0), currency };
}

export function formatMoney({ amount, currency }: Money, locale: string = site.locale): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount / 100);
}
