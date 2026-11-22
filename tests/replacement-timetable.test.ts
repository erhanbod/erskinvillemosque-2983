import { test, expect } from "bun:test";
import { TIMETABLE, TIMETABLE_DATES } from "../packages/web/src/api/data/salah-timetable";
import { applyPublishedTimetable, timetableRow } from "../packages/web/src/api/lib/published-timetable";
import { jummahFor, buildSlots } from "../packages/web/src/web/lib/prayer-board";
import type { PrayerDay } from "../packages/web/src/api/routes/prayer";
import type { SydneyNow } from "../packages/web/src/web/hooks/use-sydney-now";

const staleDay = (date = "2026-11-10"): PrayerDay => ({
  date, gregorianLong: "10 Kasım 2026 Salı", hijriLong: "hijri", hijriShort: "hijri", weekday: 2,
  times: { imsak: "04:13", gunes: "05:32", ogle: "12:44", ikindi: "16:26", aksam: "19:38", yatsi: "20:59" },
  cemaat: { imsak: "05:02", gunes: null, ogle: "12:50", ikindi: "16:32", aksam: "19:40", yatsi: "21:05" },
  kerahat: { sunrise: "05:32", israk: "06:17", kerahat: "11:59", qibla: "00:00", sunset: "19:38" },
});
test("556 valid, consecutive dates spanning the CSV coverage", () => {
  expect(TIMETABLE_DATES).toHaveLength(556);
  expect(TIMETABLE_DATES[0]).toBe("2026-06-24");
  expect(TIMETABLE_DATES.at(-1)).toBe("2027-12-31");
  for (let i = 0; i < TIMETABLE_DATES.length; i++) {
    const date = TIMETABLE_DATES[i];
    expect(TIMETABLE[date]).toHaveLength(10);
    for (const time of TIMETABLE[date]) expect(time).toMatch(/^([01]\d|2[0-3]):[0-5]\d$/);
    if (i > 0) expect(Date.parse(date) - Date.parse(TIMETABLE_DATES[i - 1])).toBe(86400000);
  }
});
test("cached Fajr Kamet is replaced immediately, without modifying cache or other times", () => {
  const old = staleDay(); const result = applyPublishedTimetable(old);
  expect(result.cemaat.imsak).toBe("05:10");
  expect(old.cemaat.imsak).toBe("05:02");
  expect(result.times).toEqual(old.times);
  expect({ ...result.cemaat, imsak: "05:02" }).toEqual(old.cemaat);
  expect(result.gregorianLong).toBe(old.gregorianLong);
  expect(result.kerahat).toBe(old.kerahat);
});
test("provided 2027 rows are exact, including Cuma sessions", () => {
  expect(timetableRow("2027-01-01")).toEqual(["04:04","05:01","13:03","13:09","16:47","16:53","20:16","20:18","21:46","21:52"]);
  expect(timetableRow("2027-12-31")).toEqual(["04:03","05:00","13:03","13:09","16:47","16:53","20:16","20:18","21:46","21:52"]);
  expect(jummahFor("2027-04-04")).toEqual({ first: "12:40", second: "13:20" });
  expect(jummahFor("2027-10-03")).toEqual({ first: "13:40", second: "14:20" });
});
test("existing boundary clamping remains consistent for prayer and Cuma", () => {
  expect(timetableRow("2026-01-01")).toEqual(TIMETABLE["2026-06-24"]);
  expect(timetableRow("2028-01-01")).toEqual(TIMETABLE["2027-12-31"]);
  expect(jummahFor("2028-01-01")).toEqual(jummahFor("2027-12-31"));
});
test("Fajr glow follows the new CSV Kamet, even after the old cutoff", () => {
  const day = applyPublishedTimetable(staleDay());
  const now = (minutes: number) => ({ date: day.date, minutes, seconds: minutes * 60 }) as SydneyNow;
  expect(buildSlots(day, now(5 * 60 + 5))[0].glow).toBe(true);
  expect(buildSlots(day, now(5 * 60 + 10))[0].glow).toBe(false);
});
