import { createHash } from "node:crypto";

export function normalizeCustomerEmail(email: string) {
  return email.trim().toLowerCase();
}

export function customerEmailIndexKey(email: string) {
  return createHash("sha256").update(normalizeCustomerEmail(email)).digest("hex");
}
