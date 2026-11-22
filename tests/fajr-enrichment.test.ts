import { test, expect } from "bun:test";
import { enrichFajrDays } from "../packages/web/src/api/lib/fajr-sunrise-service";
import type { PrayerDay } from "../packages/web/src/api/routes/prayer";
const day = (date: string): PrayerDay => ({
  date, gregorianLong: "date", hijriLong: "hijri", hijriShort: "hijri", weekday: 2,
  times: { imsak: "04:13", gunes: "05:32", ogle: "12:44", ikindi: "16:26", aksam: "19:38", yatsi: "20:59" },
  cemaat: { imsak: "05:02", gunes: null, ogle: "12:50", ikindi: "16:32", aksam: "19:40", yatsi: "21:05" },
  kerahat: { sunrise: "05:32", israk: "06:17", kerahat: "11:59", qibla: "00:00", sunset: "19:38" },
});
test("fixture integration enriches today and tomorrow only; logs and every other value stay correct", async () => {
  const input = [day("2026-11-09"), day("2026-11-10"), day("2026-11-11"), day("2026-11-12")];
  const calls: string[] = [];
  const result = await enrichFajrDays(input, new Date("2026-11-10T08:00:00Z"), async (date) => {
    calls.push(date); return { date, sunrise: "05:50", offset: 0 };
  });
  expect(calls).toEqual(["2026-11-10", "2026-11-11"]);
  for (const index of [1, 2]) {
    expect(result[index].cemaat.imsak).toBe("05:20");
    const copy = { ...result[index], cemaat: { ...result[index].cemaat, imsak: "05:02" } };
    expect(copy).toEqual(input[index]);
    expect(input[index].cemaat.imsak).toBe("05:02");
  }
  expect(result[0]).toBe(input[0]); expect(result[3]).toBe(input[3]);
});
test("API outage preserves the day's CSV Fajr Kamet without affecting other times", async () => {
  const input = [day("2026-11-10")];
  const result = await enrichFajrDays(input, new Date("2026-11-10T08:00:00Z"), async (date) => ({
    date, offset: 0, error: "Aladhan HTTP 503", retryAt: 1,
  }));
  expect(result).toEqual(input);
  expect(result[0].cemaat.imsak).toBe("05:02");
});
test("integration applies adhan fallback when Sunrise-derived Kamet is too early", async () => {
  const input = [day("2026-11-10")];
  const result = await enrichFajrDays(input, new Date("2026-11-10T08:00:00Z"), async (date) => ({
    date, sunrise: "04:30", offset: 0,
  }));
  expect(result[0].cemaat.imsak).toBe("04:13");
});
