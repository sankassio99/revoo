import { describe, expect, it } from "vitest";
import {
  getAvailableStartTimes,
  isServiceSelectionCompatible,
} from "@/features/public-booking/availability.domain";

const weekdayHours = (open: string, close: string, closed = false) =>
  Object.fromEntries(
    ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].map(
      (day) => [day, { open, close, closed }],
    ),
  );

describe("public booking availability domain", () => {
  it("requires every selected service to be assigned to the professional", () => {
    expect(isServiceSelectionCompatible(["cut", "colour", "style"], ["cut", "colour"])).toBe(
      true,
    );
    expect(isServiceSelectionCompatible(["cut", "style"], ["cut", "colour"])).toBe(false);
    expect(isServiceSelectionCompatible(["cut"], [])).toBe(false);
  });

  it("generates a 15-minute grid aligned to opening and fits the full service duration", () => {
    const times = getAvailableStartTimes({
      date: "2026-01-05",
      timeZone: "UTC",
      operatingHours: weekdayHours("09:10", "11:00"),
      durationMinutes: 30,
      appointments: [],
      now: new Date("2026-01-01T00:00:00.000Z"),
    });

    expect(times).toEqual(["09:10", "09:25", "09:40", "09:55", "10:10", "10:25"]);
  });

  it("removes starts whose service intervals overlap an existing appointment", () => {
    const times = getAvailableStartTimes({
      date: "2026-01-05",
      timeZone: "UTC",
      operatingHours: weekdayHours("09:00", "12:00"),
      durationMinutes: 60,
      appointments: [
        {
          startAt: new Date("2026-01-05T09:30:00.000Z"),
          endAt: new Date("2026-01-05T10:30:00.000Z"),
          status: "Scheduled",
        },
      ],
      now: new Date("2026-01-01T00:00:00.000Z"),
    });

    expect(times).toEqual(["10:30", "10:45", "11:00"]);
  });

  it("returns no starts on closed days or for dates before the workspace-local current date", () => {
    const common = {
      timeZone: "Asia/Tokyo",
      operatingHours: weekdayHours("09:00", "17:00"),
      durationMinutes: 30,
      appointments: [],
      now: new Date("2026-01-06T00:30:00.000Z"), // 09:30 on Tuesday in Tokyo
    };

    expect(
      getAvailableStartTimes({
        ...common,
        date: "2026-01-04",
        operatingHours: weekdayHours("09:00", "17:00", true),
        now: new Date("2026-01-01T00:00:00.000Z"),
      }),
    ).toEqual([]);
    expect(getAvailableStartTimes({ ...common, date: "2026-01-05" })).toEqual([]);
  });

  it("skips nonexistent local starts across the workspace daylight-saving boundary", () => {
    const times = getAvailableStartTimes({
      date: "2026-03-29",
      timeZone: "Europe/London",
      operatingHours: weekdayHours("00:30", "04:00"),
      durationMinutes: 30,
      appointments: [],
      now: new Date("2026-03-01T00:00:00.000Z"),
    });

    expect(times).toContain("00:30");
    expect(times).toContain("00:45");
    expect(times).not.toContain("01:00");
    expect(times).not.toContain("01:15");
    expect(times).not.toContain("01:30");
    expect(times).not.toContain("01:45");
    expect(times).toContain("02:00");
  });
});
