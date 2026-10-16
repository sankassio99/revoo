import { currencySchema } from "@/lib/validation/common";

export function toMinorUnits(amount: number, currency: string) {
  if (!Number.isFinite(amount) || amount < 0 || !currencySchema.safeParse(currency).success) {
    throw new Error("Money requires a non-negative finite amount and a valid currency code.");
  }

  const amountMinorUnits = Math.round(amount * 100);
  if (!Number.isSafeInteger(amountMinorUnits)) {
    throw new Error("Money amounts must fit within safe integer minor units.");
  }

  return amountMinorUnits;
}

export function formatMinorUnits(amountMinorUnits: number, currency: string) {
  if (!Number.isSafeInteger(amountMinorUnits) || amountMinorUnits < 0) {
    throw new Error("Money amounts must be non-negative safe integers in minor units.");
  }

  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
  }).format(amountMinorUnits / 100);
}
