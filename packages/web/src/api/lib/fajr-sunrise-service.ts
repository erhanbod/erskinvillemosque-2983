import { eq } from "drizzle-orm";
import { db } from "../database";
import { prayerCache } from "../database/schema";
import type { PrayerDay } from "../routes/prayer";
import {
  applyFajrKamet, calculateFajr, createSunriseCache, sunriseCacheKey,
  localDate, SUNRISE_OFFSET_MINUTES, type SunriseEntry,
} from "./fajr-sunrise";

const getSunrise = createSunriseCache({
  async read(key) {
    const [row] = await db.select().from(prayerCache).where(eq(prayerCache.key, key));
    return row ? JSON.parse(row.payload) as SunriseEntry : null;
  },
  async write(key, entry) {
    const values = { key, payload: JSON.stringify(entry), fetchedAt: new Date() };
    await db.insert(prayerCache).values(values).onConflictDoUpdate({ target: prayerCache.key, set: values });
  },
});
const logged = new Set<string>();

export async function enrichFajrDays(
  days: PrayerDay[], instant = new Date(), getDailySunrise: typeof getSunrise = getSunrise,
) {
  const today = localDate(instant);
  const tomorrow = new Date(`${today}T12:00:00Z`);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const tomorrowIso = tomorrow.toISOString().slice(0, 10);
  return Promise.all(days.map(async (day) => {
    if (day.date !== today && day.date !== tomorrowIso) return day;
    const entry = await getDailySunrise(day.date, day.times.imsak);
    const key = sunriseCacheKey(day.date);
    if (!entry.sunrise) {
      const logKey = `${key}:unavailable:${entry.retryAt}`;
      if (!logged.has(logKey)) {
        console.warn("[Fajr Sunrise unavailable]", {
          date: day.date, offsetMinutes: SUNRISE_OFFSET_MINUTES, error: entry.error,
          finalKamet: day.cemaat.imsak, fallback: "existing CSV Kamet", retryAt: entry.retryAt,
        });
        logged.add(logKey);
      }
      return day;
    }
    const diagnostic = calculateFajr(entry.sunrise, day.times.imsak);
    const logKey = `${key}:success:${day.times.imsak}:${entry.sunrise}`;
    if (!logged.has(logKey)) {
      console.info("[Fajr Sunrise diagnostic]", { date: day.date, fajrAdhan: day.times.imsak, ...diagnostic });
      if (diagnostic.sanityFallback) {
        console.warn("[Fajr Kamet sanity check] Calculated Kamet is not later than adhan; displaying adhan", {
          date: day.date, ...diagnostic,
        });
      }
      logged.add(logKey);
    }
    return applyFajrKamet(day, entry.sunrise);
  }));
}
