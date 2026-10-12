export const DEFAULT_TIME_ZONE = "Asia/Shanghai";

type LocalParts = { year: number; month: number; day: number; hour: number; minute: number };

function localParts(date: Date, timeZone = DEFAULT_TIME_ZONE): LocalParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return { year: value("year"), month: value("month"), day: value("day"), hour: value("hour"), minute: value("minute") };
}

function timeZoneOffsetMs(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "longOffset",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const offset = parts.find((part) => part.type === "timeZoneName")?.value ?? "GMT";
  const match = offset.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!match) return 0;
  const hours = Number(match[2]);
  const minutes = Number(match[3] ?? 0);
  const sign = match[1] === "-" ? -1 : 1;
  return sign * (hours * 60 + minutes) * 60_000;
}

function localDateToUtc(parts: LocalParts, timeZone = DEFAULT_TIME_ZONE) {
  const assumedUtc = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute));
  return new Date(assumedUtc.getTime() - timeZoneOffsetMs(assumedUtc, timeZone));
}

function addLocalDays(date: Date, days: number, timeZone = DEFAULT_TIME_ZONE) {
  const parts = localParts(date, timeZone);
  const day = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return { ...parts, year: day.getUTCFullYear(), month: day.getUTCMonth() + 1, day: day.getUTCDate() };
}

function parseClock(hourText: string | undefined, minuteText: string | undefined, meridiem: string | undefined) {
  const hour = Number(hourText ?? 9);
  const minute = Number(minuteText ?? 0);
  if (!Number.isInteger(hour) || hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  let normalizedHour = hour;
  if (meridiem) {
    const lower = meridiem.toLowerCase();
    if (hour < 1 || hour > 12) return null;
    normalizedHour = lower === "pm" ? (hour === 12 ? 12 : hour + 12) : hour === 12 ? 0 : hour;
  }
  return { hour: normalizedHour, minute };
}

export type ReminderRequest = {
  title: string;
  dueAt: Date;
  recurrence: "once" | "daily" | "yearly";
  interpretation: string;
};

export function parseReminderRequest(input: string, now = new Date(), timeZone = DEFAULT_TIME_ZONE): ReminderRequest | null {
  const text = input.trim().replace(/\s+/g, " ");

  const relative = text.match(/^remind(?: me)? in (\d+)\s*(minutes?|mins?|hours?|hrs?|days?)\s+(?:to\s+)?(.+)$/i);
  if (relative) {
    const amount = Number(relative[1]);
    const unit = relative[2].toLowerCase();
    const multiplier = unit.startsWith("minute") || unit.startsWith("min") ? 60_000 : unit.startsWith("hour") || unit.startsWith("hr") ? 3_600_000 : 86_400_000;
    const dueAt = new Date(now.getTime() + amount * multiplier);
    return { title: relative[3].trim(), dueAt, recurrence: "once", interpretation: `in ${amount} ${relative[2]}` };
  }

  const dayTime = text.match(/^remind(?: me)?\s+(today|tomorrow)(?:\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?)?\s+(?:to\s+)?(.+)$/i);
  if (dayTime) {
    const days = dayTime[1].toLowerCase() === "tomorrow" ? 1 : 0;
    const clock = parseClock(dayTime[2], dayTime[3], dayTime[4]);
    if (!clock) return null;
    const target = addLocalDays(now, days, timeZone);
    const dueAt = localDateToUtc({ ...target, hour: clock.hour, minute: clock.minute }, timeZone);
    const safeDueAt = dueAt <= now && days === 0
      ? localDateToUtc({ ...addLocalDays(now, 1, timeZone), hour: clock.hour, minute: clock.minute }, timeZone)
      : dueAt;
    const clockLabel = formatDateTime(safeDueAt, timeZone);
    return { title: dayTime[5].trim(), dueAt: safeDueAt, recurrence: "once", interpretation: clockLabel };
  }

  const daily = text.match(/^daily\s+(?:check[- ]?in|reminder)(?:\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?)?(?:\s+to\s+(.+))?$/i);
  if (daily) {
    const clock = parseClock(daily[1], daily[2], daily[3]);
    if (!clock) return null;
    const current = localParts(now, timeZone);
    let dueAt = localDateToUtc({ ...current, hour: clock.hour, minute: clock.minute }, timeZone);
    if (dueAt <= now) dueAt = localDateToUtc({ ...addLocalDays(now, 1, timeZone), hour: clock.hour, minute: clock.minute }, timeZone);
    const title = daily[4]?.trim() || "Daily check-in";
    return { title, dueAt, recurrence: "daily", interpretation: `every day at ${formatDateTime(dueAt, timeZone).split(", ")[1]}` };
  }

  return null;
}

export function formatDateTime(date: Date | string, timeZone = DEFAULT_TIME_ZONE) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export function localDateKey(date = new Date(), timeZone = DEFAULT_TIME_ZONE) {
  const parts = localParts(date, timeZone);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

