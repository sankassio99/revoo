import { describe, expect, it } from "vitest";
import { getLocalDayBounds, localDateTimeToUtc } from "@/lib/domain/time";

describe("getLocalDayBounds", () => {
  it("uses local calendar boundaries across the spring daylight-saving shift", () => {
    const { start, end } = getLocalDayBounds(
      new Date("2025-03-30T12:00:00.000Z"),
      "Europe/Berlin",
    );

    expect(start.toISOString()).toBe("2025-03-29T23:00:00.000Z");
    expect(end.toISOString()).toBe("2025-03-30T22:00:00.000Z");
    expect(end.getTime() - start.getTime()).toBe(23 * 60 * 60 * 1000);
  });

  it("rejects invalid time-zone identifiers", () => {
    expect(() => getLocalDayBounds(new Date(), "Mars/Crater")).toThrow();
  });

  it("rejects local times skipped or repeated during clock changes", () => {
    expect(() => localDateTimeToUtc("2025-03-30T02:30", "Europe/Berlin")).toThrow(
      /does not exist/,
    );
    expect(() => localDateTimeToUtc("2025-10-26T02:30", "Europe/Berlin")).toThrow(
      /occurs twice/,
    );
  });

  it("converts an unambiguous local time to the correct UTC instant", () => {
    expect(localDateTimeToUtc("2025-01-15T09:30", "Europe/Berlin").toISOString()).toBe(
      "2025-01-15T08:30:00.000Z",
    );
  });
});
