import { expect, test } from "bun:test";
import type { PrayerDay } from "../packages/web/src/api/routes/prayer";
import type { SydneyNow } from "../packages/web/src/web/hooks/use-sydney-now";
import { PRAYERS, showQuietReminder, toMinutes, jummahFor } from "../packages/web/src/web/lib/prayer-board";
import { applyPublishedTimetable } from "../packages/web/src/api/lib/published-timetable";

const day = (date = "2026-11-10", weekday = 2) => applyPublishedTimetable({
  date, weekday, times: {}, cemaat: {}, kerahat: {},
} as PrayerDay);
const now = (seconds: number, date = "2026-11-10") => ({ seconds, minutes: Math.floor(seconds / 60), date }) as SydneyNow;

test("all five reminders include adhan minus five minutes, exclude Kamet", () => {
  const today = day();
  for (const { key } of PRAYERS) {
    const adhan = toMinutes(today.times[key]) * 60;
    const end = toMinutes(today.cemaat[key]!) * 60;
    expect(showQuietReminder(today, now(adhan - 301))).toBe(false);
    expect(showQuietReminder(today, now(adhan - 300))).toBe(true);
    expect(showQuietReminder(today, now(adhan))).toBe(true);
    expect(showQuietReminder(today, now(end - 1))).toBe(true);
    expect(showQuietReminder(today, now(end))).toBe(false);
  }
});
test("long Fajr remains visible after 25 minutes and short Maghrib stops at Kamet", () => {
  expect(showQuietReminder(day(), now(5 * 3600 + 5 * 60))).toBe(true);
  expect(showQuietReminder(day(), now(19 * 3600 + 40 * 60))).toBe(false);
});
test("missing Kamet does not invent a window", () => {
  const today = day(); today.cemaat.imsak = null;
  expect(showQuietReminder(today, now(4 * 3600 + 13 * 60))).toBe(false);
});
test("Friday retains daily Dhuhr, but neither Cuma session triggers a window", () => {
  const today = day("2026-11-13", 5);
  expect(showQuietReminder(today, now(toMinutes(today.times.ogle) * 60))).toBe(true);
  for (const time of Object.values(jummahFor(today.date))) {
    expect(showQuietReminder(today, now(toMinutes(time) * 60 - 300))).toBe(false);
    expect(showQuietReminder(today, now(toMinutes(time) * 60 - 1))).toBe(false);
  }
});
test("new local date uses the new day's timetable, with no midnight reminder", () => {
  for (const date of ["2026-11-10", "2026-11-11", "2027-04-04", "2027-10-03"]) {
    const today = day(date);
    expect(showQuietReminder(today, now(0, date))).toBe(false);
    expect(showQuietReminder(today, now(86399, date))).toBe(false);
    expect(showQuietReminder(today, now(toMinutes(today.times.imsak) * 60 - 300, date))).toBe(true);
  }
});