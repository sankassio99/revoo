import { describe, expect, it } from "vitest";
import { appointmentIntervalOverlaps } from "@/features/appointments/appointment.schema";
import {
  canTransitionAppointment,
  appointmentInputSchema,
} from "@/features/appointments/appointment.schema";
import {
  customerInputSchema,
  customerSearchTerms,
} from "@/features/customers/customer.schema";

describe("customer validation and search", () => {
  it("requires a usable name and phone while allowing email to be omitted", () => {
    expect(customerInputSchema.safeParse({ name: "Sam Lee", phone: "+1 555 222 3333" }).success).toBe(true);
    expect(customerInputSchema.safeParse({ name: "S", phone: "5551234" }).success).toBe(false);
  });

  it("creates name and phone prefixes for workspace-scoped matching", () => {
    const terms = customerSearchTerms("Élodie Martin", "+1 (555) 123-4567");
    expect(terms).toContain("elo");
    expect(terms).toContain("elodie martin");
    expect(terms).toContain("1555123");
  });
});

describe("appointment validation", () => {
  it("requires all workspace record references and a local start time", () => {
    expect(
      appointmentInputSchema.safeParse({
        customerId: "customer",
        serviceIds: ["service"],
        professionalId: "professional",
        localStart: "2026-01-05T09:30",
      }).success,
    ).toBe(true);
  });

  it("allows only supported appointment state transitions", () => {
    expect(canTransitionAppointment("Scheduled", "Confirmed")).toBe(true);
    expect(canTransitionAppointment("Scheduled", "Completed")).toBe(true);
    expect(canTransitionAppointment("Completed", "Cancelled")).toBe(false);
  });

  it("detects partial overlap and allows adjacent appointment intervals", () => {
    const first = {
      startAt: new Date("2026-01-05T09:00:00Z"),
      endAt: new Date("2026-01-05T10:00:00Z"),
    };
    expect(appointmentIntervalOverlaps(first, {
      startAt: new Date("2026-01-05T09:30:00Z"),
      endAt: new Date("2026-01-05T10:30:00Z"),
    })).toBe(true);
    expect(appointmentIntervalOverlaps(first, {
      startAt: new Date("2026-01-05T10:00:00Z"),
      endAt: new Date("2026-01-05T11:00:00Z"),
    })).toBe(false);
  });
});
