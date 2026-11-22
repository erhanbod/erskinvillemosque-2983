/** Only calibration knob: minutes to add to Aladhan's Diyanet-method Sunrise. */
export const SUNRISE_OFFSET_MINUTES = 0;
export const SUNRISE_LOCATION = {
  city: "Auburn", state: "NSW", country: "Australia", timeZone: "Australia/Sydney", method: 13,
} as const;

export function clockMinutes(value: string) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) throw new Error(`Invalid HH:MM: ${value}`);
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}
export function clockAt(minutes: number) {
  const wrapped = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(wrapped / 60)).padStart(2, "0")}:${String(wrapped % 60).padStart(2, "0")}`;
}
export function calculateFajr(sunrise: string, adhan: string, offset = SUNRISE_OFFSET_MINUTES) {
  if (!Number.isInteger(offset)) throw new Error("Sunrise offset must be an integer");
  const adjustedMinutes = clockMinutes(sunrise) + offset;
  const kametMinutes = adjustedMinutes - 30;
  const calculatedKamet = clockAt(kametMinutes);
  // Compare unwrapped minutes as well, so a negative result cannot masquerade as 23:xx.
  const valid = kametMinutes > clockMinutes(adhan) && kametMinutes < 1440;
  return {
    aladhanSunrise: sunrise, offsetMinutes: offset,
    adjustedSunrise: clockAt(adjustedMinutes), calculatedKamet,
    finalKamet: valid ? calculatedKamet : adhan, sanityFallback: !valid,
  };
}

export function sunriseCacheKey(date: string, offset = SUNRISE_OFFSET_MINUTES) {
  return `aladhan-sunrise:v1:${SUNRISE_LOCATION.city}:${SUNRISE_LOCATION.state}:${SUNRISE_LOCATION.country}:${SUNRISE_LOCATION.timeZone}:method13:offset${offset}:${date}`;
}
export function sunriseUrl(date: string) {
  const [y, m, d] = date.split("-");
  const url = new URL(`https://api.aladhan.com/v1/timingsByCity/${d}-${m}-${y}`);
  url.search = new URLSearchParams({
    city: SUNRISE_LOCATION.city, state: SUNRISE_LOCATION.state,
    country: SUNRISE_LOCATION.country, method: String(SUNRISE_LOCATION.method),
    timezonestring: SUNRISE_LOCATION.timeZone,
  }).toString();
  return url.toString();
}

/** Read only timings.Sunrise, never astronomical/other solar fields. */
export function validateSunrise(body: unknown, date: string): string {
  const j = body as {
    code?: number; data?: { timings?: { Sunrise?: string };
      date?: { gregorian?: { date?: string } }; meta?: { timezone?: string; method?: { id?: number } } };
  };
  const [y, m, d] = date.split("-");
  if (j?.code !== 200 || j.data?.date?.gregorian?.date !== `${d}-${m}-${y}` ||
    j.data?.meta?.timezone !== SUNRISE_LOCATION.timeZone || j.data?.meta?.method?.id !== 13) {
    throw new Error("Aladhan response failed status/date/timezone/method validation");
  }
  const raw = j.data?.timings?.Sunrise;
  // Aladhan can append a zone label, e.g. 05:50 (AEDT).
  if (typeof raw !== "string" || !/^\d{2}:\d{2}(?:\s+\([A-Za-z+\d:-]+\))?$/.test(raw)) {
    throw new Error("Missing or malformed Aladhan timings.Sunrise");
  }
  const hhmm = raw.slice(0, 5);
  clockMinutes(hhmm);
  return hhmm;
}

export type SunriseEntry = {
  date: string; sunrise?: string; offset: number;
  calculated?: ReturnType<typeof calculateFajr>; retryAt?: number; error?: string;
};
type Store = {
  read: (key: string) => Promise<SunriseEntry | null>;
  write: (key: string, entry: SunriseEntry) => Promise<void>;
};

/** Persistent daily cache, request coalescing, and 15-minute failure backoff. */
export function createSunriseCache(store: Store, fetcher: typeof fetch = fetch, now = Date.now) {
  const memory = new Map<string, SunriseEntry>();
  const pending = new Map<string, Promise<SunriseEntry>>();
  return function get(date: string, adhan: string, offset = SUNRISE_OFFSET_MINUTES): Promise<SunriseEntry> {
    const key = sunriseCacheKey(date, offset);
    const inFlight = pending.get(key);
    if (inFlight) return inFlight;
    const task = (async () => {
      const cached = memory.get(key) ?? await store.read(key).catch(() => null);
      if (cached && cached.date === date && cached.offset === offset &&
        (cached.sunrise || (cached.retryAt ?? 0) > now())) return cached;
      let entry: SunriseEntry;
      try {
        const response = await fetcher(sunriseUrl(date), { signal: AbortSignal.timeout(15_000) });
        if (!response.ok) throw new Error(`Aladhan HTTP ${response.status}`);
        const sunrise = validateSunrise(await response.json(), date);
        entry = { date, sunrise, offset, calculated: calculateFajr(sunrise, adhan, offset) };
      } catch (error) {
        entry = { date, offset, retryAt: now() + 15 * 60_000,
          error: error instanceof Error ? error.message : String(error) };
      }
      memory.set(key, entry);
      await store.write(key, entry).catch((error) => console.warn("[Fajr Sunrise cache] persistence failed", error));
      return entry;
    })();
    pending.set(key, task);
    void task.finally(() => pending.delete(key));
    return task;
  };
}

/** Return a new day object; never mutate the CSV/Diyanet cache. */
export function applyFajrKamet<T extends { times: { imsak: string }; cemaat: { imsak: string | null } }>(
  day: T, sunrise: string, offset = SUNRISE_OFFSET_MINUTES,
): T {
  const result = calculateFajr(sunrise, day.times.imsak, offset);
  return { ...day, cemaat: { ...day.cemaat, imsak: result.finalKamet } };
}

const sydneyDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: SUNRISE_LOCATION.timeZone, year: "numeric", month: "2-digit", day: "2-digit",
});
export function localDate(date: Date) {
  const parts = sydneyDate.formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}
