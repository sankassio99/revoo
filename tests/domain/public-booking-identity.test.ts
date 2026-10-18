import { describe, expect, it } from "vitest";
import {
  publicClientRegistrationSchema,
  publicClientEmailSchema,
} from "@/features/public-booking/public-booking.schema";

describe("public booking client registration validation", () => {
  it("trims names and accepts the 2–120 character boundaries", () => {
    expect(publicClientRegistrationSchema.parse({ email: "client@example.test", name: "  Al  ", phone: " 1234567 " })).toMatchObject({
      name: "Al",
      phone: "1234567",
    });
    expect(publicClientRegistrationSchema.safeParse({ email: "client@example.test", name: "A", phone: "1234567" }).success).toBe(false);
    expect(publicClientRegistrationSchema.safeParse({ email: "client@example.test", name: "N".repeat(120), phone: "1234567" }).success).toBe(true);
    expect(publicClientRegistrationSchema.safeParse({ email: "client@example.test", name: "N".repeat(121), phone: "1234567" }).success).toBe(false);
  });

  it("trims phone numbers, enforces length, and requires at least seven digits", () => {
    expect(publicClientRegistrationSchema.parse({ email: "client@example.test", name: "Alex", phone: "  +44 (20) 1234  " }).phone).toBe("+44 (20) 1234");
    expect(publicClientRegistrationSchema.safeParse({ email: "client@example.test", name: "Alex", phone: "123456" }).success).toBe(false);
    expect(publicClientRegistrationSchema.safeParse({ email: "client@example.test", name: "Alex", phone: "-------" }).success).toBe(false);
    expect(publicClientRegistrationSchema.safeParse({ email: "client@example.test", name: "Alex", phone: "1".repeat(24) }).success).toBe(true);
    expect(publicClientRegistrationSchema.safeParse({ email: "client@example.test", name: "Alex", phone: "1".repeat(25) }).success).toBe(false);
    expect(publicClientRegistrationSchema.safeParse({ email: "client@example.test", name: "Alex", phone: "+44 (20) 123456" }).success).toBe(true);
  });

  it("trims and validates provided email addresses up to 254 characters", () => {
    expect(publicClientEmailSchema.parse("  client@example.test  ")).toBe("client@example.test");
    expect(publicClientEmailSchema.safeParse("not-an-email").success).toBe(false);
    const maximumLengthEmail = `${"a".repeat(241)}@example.test`;
    expect(maximumLengthEmail).toHaveLength(254);
    expect(publicClientEmailSchema.safeParse(maximumLengthEmail).success).toBe(true);
    expect(publicClientEmailSchema.safeParse(`a${maximumLengthEmail}`).success).toBe(false);
  });
});
