import { describe, expect, it } from "vitest";
import {
  buildPublicAppointmentConfirmation,
} from "@/features/public-booking/public-appointment.domain";
import { publicAppointmentInputSchema } from "@/features/public-booking/public-booking.schema";

describe("public appointment request validation", () => {
  it("accepts only the public booking fields", () => {
    const parsed = publicAppointmentInputSchema.parse({
      email: "client@example.test",
      professionalId: "professional-1",
      serviceIds: ["service-1", "service-2"],
      localStart: "2026-10-19T09:00",
    });

    expect(parsed).toEqual({
      email: "client@example.test",
      professionalId: "professional-1",
      serviceIds: ["service-1", "service-2"],
      localStart: "2026-10-19T09:00",
    });
  });

  it("rejects caller-supplied customer ID, price, duration, or end-time fields", () => {
    expect(
      publicAppointmentInputSchema.safeParse({
        email: "client@example.test",
        professionalId: "professional-1",
        serviceIds: ["service-1"],
        localStart: "2026-10-19T09:00",
        customerId: "spoofed-customer",
        priceMinorUnits: 1,
        durationMinutes: 1,
        endAt: "2026-10-19T09:01",
      }).success,
    ).toBe(false);
  });

  it.each([
    { email: "client@example.test", professionalId: "", serviceIds: ["service-1"], localStart: "2026-10-19T09:00" },
    { email: "client@example.test", professionalId: "professional-1", serviceIds: [], localStart: "2026-10-19T09:00" },
    {
      email: "client@example.test",
      professionalId: "professional-1",
      serviceIds: ["service-1", "service-1"],
      localStart: "2026-10-19T09:00",
    },
    {
      email: "client@example.test",
      professionalId: "professional-1",
      serviceIds: Array.from({ length: 21 }, (_, index) => `service-${index}`),
      localStart: "2026-10-19T09:00",
    },
    { email: "client@example.test", professionalId: "professional-1", serviceIds: ["service-1"], localStart: "2026-2-19T09:00" },
    { email: "client@example.test", professionalId: "professional-1", serviceIds: ["service-1"], localStart: "2026-10-19 09:00" },
    { email: "client@example.test", professionalId: "professional-1", serviceIds: ["service-1"], localStart: "2026-10-19T24:00" },
    { email: "client@example.test", professionalId: "professional-1", serviceIds: ["service-1"], localStart: "2026-02-30T09:00" },
  ])("rejects malformed or unbounded request data: %o", (input) => {
    expect(publicAppointmentInputSchema.safeParse(input).success).toBe(false);
  });
});

describe("public appointment confirmation mapping", () => {
  it("maps the stored UTC interval to local start and end using the booking time zone", () => {
    const confirmation = buildPublicAppointmentConfirmation({
      id: "appointment-1",
      workspaceName: "London Studio",
      professionalName: "Alex",
      services: [
        { name: "Consultation", durationMinutes: 60, priceMinorUnits: 5000 },
      ],
      startAt: new Date("2026-03-29T00:30:00.000Z"),
      endAt: new Date("2026-03-29T01:30:00.000Z"),
      timeZone: "Europe/London",
      status: "Scheduled",
    });

    expect(confirmation).toMatchObject({
      id: "appointment-1",
      workspaceName: "London Studio",
      professionalName: "Alex",
      localStart: "2026-03-29T00:30",
      localEnd: "2026-03-29T02:30",
      timeZone: "Europe/London",
      status: "Scheduled",
    });
  });
});
