import { describe, test, expect } from "bun:test";
import {
  applyFajrKamet, calculateFajr, clockAt, createSunriseCache, localDate,
  sunriseCacheKey, sunriseUrl, validateSunrise, type SunriseEntry,
} from "../packages/web/src/api/lib/fajr-sunrise";

const response = (sunrise = "05:50 (AEDT)", date = "10-11-2026") => ({
  code: 200, data: { timings: { Sunrise: sunrise, Sunset: "20:00", AstronomicalSunrise: "00:00" },
    date: { gregorian: { date } }, meta: { timezone: "Australia/Sydney", method: { id: 13 } } },
});
function store() {
  const data = new Map<string, SunriseEntry>();
  return { data, async read(key: string) { return data.get(key) ?? null; },
    async write(key: string, value: SunriseEntry) { data.set(key, value); } };
}
function fakeFetch(fn: () => Promise<Response>) { return fn as typeof fetch; }

describe("Fajr Kamet calculation", () => {
  test("Sunrise minus exactly 30 minutes with default zero offset", () => {
    expect(calculateFajr("05:50", "04:13")).toEqual({ aladhanSunrise: "05:50", offsetMinutes: 0,
      adjustedSunrise: "05:50", calculatedKamet: "05:20", finalKamet: "05:20", sanityFallback: false });
  });
  test("positive and negative offsets", () => {
    expect(calculateFajr("05:50", "04:13", 5).finalKamet).toBe("05:25");
    expect(calculateFajr("05:50", "04:13", -7).finalKamet).toBe("05:13");
  });
  test("HH:MM wrapping does not defeat sanity check", () => {
    expect(clockAt(-20)).toBe("23:40");
    expect(clockAt(1450)).toBe("00:10");
    expect(calculateFajr("00:10", "00:05").finalKamet).toBe("00:05");
  });
  test("equal/earlier Kamet falls back to adhan", () => {
    expect(calculateFajr("05:50", "05:20").sanityFallback).toBe(true);
    expect(calculateFajr("05:50", "05:21").finalKamet).toBe("05:21");
  });
  test("reject malformed times and non-integer offsets", () => {
    expect(() => calculateFajr("25:10", "04:00")).toThrow();
    expect(() => calculateFajr("05:50", "04:00", 0.5)).toThrow();
  });
  test("leaves every non-Fajr field untouched and does not mutate the day", () => {
    const day = { times: { imsak: "04:13", ogle: "12:44", yatsi: "20:59" },
      cemaat: { imsak: "05:03", ogle: "12:50", yatsi: "21:05" }, other: { jummah: "13:40" } };
    const enriched = applyFajrKamet(day, "05:50");
    expect(day.cemaat.imsak).toBe("05:03");
    expect(enriched.cemaat.imsak).toBe("05:20");
    expect(enriched.times).toBe(day.times);
    expect(enriched.cemaat.ogle).toBe(day.cemaat.ogle);
    expect(enriched.cemaat.yatsi).toBe(day.cemaat.yatsi);
    expect(enriched.other).toBe(day.other);
  });
});
describe("Aladhan response and request", () => {
  test("only reads Sunrise and accepts its zone suffix", () => {
    expect(validateSunrise(response(), "2026-11-10")).toBe("05:50");
  });
  test("rejects wrong date, zone, method, invalid/missing Sunrise, API failure", () => {
    for (const invalid of [response("99:99"), response("05:50", "09-11-2026"),
      { code: 503, data: "unavailable" },
      { ...response(), data: { ...response().data, timings: { Sunset: "20:00" } } },
      { ...response(), data: { ...response().data, meta: { timezone: "UTC", method: { id: 13 } } } },
      { ...response(), data: { ...response().data, meta: { timezone: "Australia/Sydney", method: { id: 3 } } } },
    ]) expect(() => validateSunrise(invalid, "2026-11-10")).toThrow();
  });
  test("fixed existing location, method 13, Sydney timezone, no double tune", () => {
    const url = new URL(sunriseUrl("2026-11-10"));
    expect(url.pathname).toBe("/v1/timingsByCity/10-11-2026");
    expect(url.searchParams.get("city")).toBe("Auburn");
    expect(url.searchParams.get("method")).toBe("13");
    expect(url.searchParams.get("timezonestring")).toBe("Australia/Sydney");
    expect(url.searchParams.has("tune")).toBe(false);
    expect(sunriseCacheKey("2026-11-10", 0)).not.toBe(sunriseCacheKey("2026-11-10", 5));
  });
});
describe("daily cache", () => {
  test("coalesces concurrent fetches, persists and reuses success across restarts", async () => {
    const db = store(); let calls = 0;
    const fetcher = fakeFetch(async () => { calls++; return Response.json(response()); });
    const get = createSunriseCache(db, fetcher);
    const results = await Promise.all([get("2026-11-10", "04:13"), get("2026-11-10", "04:13")]);
    expect(results[0].calculated?.finalKamet).toBe("05:20");
    await get("2026-11-10", "04:13");
    await createSunriseCache(db, fetcher)("2026-11-10", "04:13");
    expect(calls).toBe(1);
    await get("2026-11-10", "04:13", 5);
    expect(calls).toBe(2);
  });
  test("new local day does not reuse yesterday", async () => {
    const db = store(); let calls = 0;
    const fetcher = fakeFetch(async () => { calls++; return Response.json(response("05:50", calls === 1 ? "10-11-2026" : "11-11-2026")); });
    const get = createSunriseCache(db, fetcher);
    await get("2026-11-10", "04:13"); await get("2026-11-11", "04:12");
    expect(calls).toBe(2);
  });
  test("503 failure is persisted and throttled, then retried after 15 minutes", async () => {
    const db = store(); let calls = 0; let timestamp = 0;
    const fetcher = fakeFetch(async () => { calls++; return new Response("down", { status: 503 }); });
    const get = createSunriseCache(db, fetcher, () => timestamp);
    expect((await get("2026-11-10", "04:13")).error).toBe("Aladhan HTTP 503");
    await get("2026-11-10", "04:13");
    await createSunriseCache(db, fetcher, () => timestamp)("2026-11-10", "04:13");
    expect(calls).toBe(1);
    timestamp = 900001;
    await get("2026-11-10", "04:13"); expect(calls).toBe(2);
  });
});
describe("DST-aware day boundaries", () => {
  test("Sydney midnight uses UTC+11 in summer and UTC+10 in winter", () => {
    expect(localDate(new Date("2026-11-09T12:59:59Z"))).toBe("2026-11-09");
    expect(localDate(new Date("2026-11-09T13:00:00Z"))).toBe("2026-11-10");
    expect(localDate(new Date("2027-06-09T13:59:59Z"))).toBe("2027-06-09");
    expect(localDate(new Date("2027-06-09T14:00:00Z"))).toBe("2027-06-10");
  });
  test("spring and autumn switch hours keep the correct local date", () => {
    for (const t of ["2026-10-03T15:59:59Z", "2026-10-03T16:00:00Z"]) expect(localDate(new Date(t))).toBe("2026-10-04");
    for (const t of ["2027-04-03T15:59:59Z", "2027-04-03T16:00:00Z"]) expect(localDate(new Date(t))).toBe("2027-04-04");
  });
});
