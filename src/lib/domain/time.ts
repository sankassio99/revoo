function getZonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

function partsMatch(
  parts: Record<string, string>,
  values: { year: number; month: number; day: number; hour: number; minute: number },
) {
  return (
    Number(parts.year) === values.year &&
    Number(parts.month) === values.month &&
    Number(parts.day) === values.day &&
    Number(parts.hour) === values.hour &&
    Number(parts.minute) === values.minute
  );
}

export function localDateTimeToUtc(value: string, timeZone: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) throw new Error("Choose a valid local appointment date and time.");

  const [, yearText, monthText, dayText, hourText, minuteText] = match;
  const values = {
    year: Number(yearText),
    month: Number(monthText),
    day: Number(dayText),
    hour: Number(hourText),
    minute: Number(minuteText),
  };
  const targetWallTime = Date.UTC(
    values.year,
    values.month - 1,
    values.day,
    values.hour,
    values.minute,
  );
  const normalized = new Date(targetWallTime);
  if (
    normalized.getUTCFullYear() !== values.year ||
    normalized.getUTCMonth() + 1 !== values.month ||
    normalized.getUTCDate() !== values.day ||
    values.hour > 23 ||
    values.minute > 59
  ) {
    throw new Error("Choose a valid local appointment date and time.");
  }

  const candidates = new Set<number>();
  for (const offsetHours of [-36, -24, -12, 0, 12, 24, 36]) {
    let candidate = targetWallTime + offsetHours * 60 * 60 * 1000;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const parts = getZonedParts(new Date(candidate), timeZone);
      const representedWallTime = Date.UTC(
        Number(parts.year),
        Number(parts.month) - 1,
        Number(parts.day),
        Number(parts.hour),
        Number(parts.minute),
        Number(parts.second),
      );
      const adjustedCandidate = targetWallTime - (representedWallTime - candidate);
      if (adjustedCandidate === candidate) break;
      candidate = adjustedCandidate;
    }

    const parts = getZonedParts(new Date(candidate), timeZone);
    if (partsMatch(parts, values)) candidates.add(candidate);
  }

  if (candidates.size === 0) {
    throw new Error("That local time does not exist because of a clock change.");
  }
  if (candidates.size > 1) {
    throw new Error("That local time occurs twice because of a clock change; choose another time.");
  }
  return new Date([...candidates][0]);
}

export function getLocalDateTime(date: Date, timeZone: string) {
  const parts = getZonedParts(date, timeZone);
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

function zonedMidnightUtc(year: number, month: number, day: number, timeZone: string) {
  const targetWallTime = Date.UTC(year, month - 1, day, 0, 0, 0);
  let utcCandidate = targetWallTime;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = getZonedParts(new Date(utcCandidate), timeZone);
    const representedWallTime = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second),
    );
    const offset = representedWallTime - utcCandidate;
    const adjustedCandidate = targetWallTime - offset;
    if (adjustedCandidate === utcCandidate) break;
    utcCandidate = adjustedCandidate;
  }

  return new Date(utcCandidate);
}

export function getLocalDayBounds(now: Date, timeZone: string) {
  const parts = getZonedParts(now, timeZone);
  const year = Number(parts.year);
  const month = Number(parts.month);
  const day = Number(parts.day);
  const nextDay = new Date(Date.UTC(year, month - 1, day + 1));

  return {
    start: zonedMidnightUtc(year, month, day, timeZone),
    end: zonedMidnightUtc(
      nextDay.getUTCFullYear(),
      nextDay.getUTCMonth() + 1,
      nextDay.getUTCDate(),
      timeZone,
    ),
  };
}

export function formatLocalTime(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatLocalDate(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en", {
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(date);
}
