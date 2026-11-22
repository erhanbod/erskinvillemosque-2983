import { z } from "zod";
import { applyPublishedTimetable, timetableRow } from "../lib/published-timetable";
import { eq } from "drizzle-orm";
import { base } from "../__core/app";
import { db } from "../database";
import * as schema from "../database/schema";

/**
 * Diyanet prayer times for Auburn, NSW.
 *
 * Source: public Diyanet mirror (ezanvakti.emushaf.net) which republishes
 * namazvakti.diyanet.gov.tr data. Auburn (AUSTRALIA) district id = 11432.
 */
const DIYANET_BASE = "https://ezanvakti.emushaf.net";
export const AUBURN_DISTRICT_ID = "11432";
const CACHE_KEY = `diyanet:${AUBURN_DISTRICT_ID}`;
/** Refresh the upstream at most every 6 hours — the feed only changes daily. */
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

/*
 * All displayed prayer/Kamet times come from the authoritative uploaded CSV.
 * Cuma sessions are looked up from its separate compiled session table.
 * Diyanet is kept for date labels; Aladhan enrichment is disabled.
 */

type RawDay = {
  MiladiTarihKisaIso8601: string | null;
  MiladiTarihKisa: string;
  MiladiTarihUzun: string;
  HicriTarihUzun: string;
  HicriTarihKisa: string;
  Imsak: string;
  Gunes: string;
  Ogle: string;
  Ikindi: string;
  Aksam: string;
  Yatsi: string;
  GunesDogus: string;
  GunesBatis: string;
  KibleSaati: string;
};

export type PrayerDay = {
  /** ISO date, YYYY-MM-DD, in Australia/Sydney. */
  date: string;
  gregorianLong: string;
  hijriLong: string;
  hijriShort: string;
  /** 0 = Sunday … 5 = Friday. */
  weekday: number;
  times: {
    imsak: string;
    gunes: string;
    ogle: string;
    ikindi: string;
    aksam: string;
    yatsi: string;
  };
  /** Congregation times; null where there is none (sunrise). */
  cemaat: {
    imsak: string | null;
    gunes: null;
    ogle: string | null;
    ikindi: string | null;
    aksam: string | null;
    yatsi: string | null;
  };
  kerahat: {
    sunrise: string;
    israk: string;
    kerahat: string;
    qibla: string;
    sunset: string;
  };
};

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

const toClock = (minutes: number) => {
  const wrapped = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const shift = (hhmm: string, delta: number) => toClock(toMinutes(hhmm) + delta);

/** "24.08.2026" -> "2026-08-24" */
const toIsoDate = (raw: RawDay) => {
  const iso = raw.MiladiTarihKisaIso8601;
  if (iso && /^\d{4}-\d{2}-\d{2}/.test(iso)) return iso.slice(0, 10);
  const [d, m, y] = raw.MiladiTarihKisa.split(".");
  return `${y}-${m}-${d}`;
};

function normalise(raw: RawDay): PrayerDay {
  const date = toIsoDate(raw);
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();

  // Every displayed time comes from the mosque's published timetable.
  const [
    fajr,
    fajrIqamah,
    ogle,
    ogleIqamah,
    ikindi,
    ikindiIqamah,
    aksam,
    aksamIqamah,
    yatsi,
    yatsiIqamah,
  ] = timetableRow(date);

  return {
    date,
    gregorianLong: raw.MiladiTarihUzun,
    hijriLong: raw.HicriTarihUzun,
    hijriShort: raw.HicriTarihKisa,
    weekday,
    times: {
      imsak: fajr,
      gunes: raw.Gunes,
      ogle,
      ikindi,
      aksam,
      yatsi,
    },
    cemaat: {
      imsak: fajrIqamah,
      gunes: null,
      ogle: ogleIqamah,
      ikindi: ikindiIqamah,
      aksam: aksamIqamah,
      yatsi: yatsiIqamah,
    },
    kerahat: {
      sunrise: raw.Gunes,
      israk: shift(raw.Gunes, 45),
      kerahat: shift(ogle, -45),
      qibla: raw.KibleSaati,
      sunset: raw.GunesBatis || raw.Aksam,
    },
  };
}

async function fetchUpstream(): Promise<PrayerDay[]> {
  const res = await fetch(`${DIYANET_BASE}/vakitler/${AUBURN_DISTRICT_ID}`, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Diyanet mirror responded ${res.status}`);
  const raw = (await res.json()) as RawDay[];
  if (!Array.isArray(raw) || raw.length === 0) throw new Error("Diyanet mirror returned no days");
  return raw.map(normalise);
}

async function readCache() {
  const [row] = await db
    .select()
    .from(schema.prayerCache)
    .where(eq(schema.prayerCache.key, CACHE_KEY));
  if (!row) return null;
  return { days: JSON.parse(row.payload) as PrayerDay[], fetchedAt: row.fetchedAt };
}

async function writeCache(days: PrayerDay[]) {
  const now = new Date();
  await db
    .insert(schema.prayerCache)
    .values({ key: CACHE_KEY, payload: JSON.stringify(days), fetchedAt: now })
    .onConflictDoUpdate({
      target: schema.prayerCache.key,
      set: { payload: JSON.stringify(days), fetchedAt: now },
    });
}

/**
 * Always returns times if we have ever fetched them: a failed upstream call
 * falls back to the last good payload so the TV board never goes blank.
 */
async function getDays(force = false) {
  const cached = await readCache().catch(() => null);
  const fresh = cached && Date.now() - cached.fetchedAt.getTime() < CACHE_TTL_MS;
  if (cached && fresh && !force) {
    return { days: cached.days, fetchedAt: cached.fetchedAt.toISOString(), stale: false };
  }

  try {
    const days = await fetchUpstream();
    await writeCache(days).catch(() => undefined);
    return { days, fetchedAt: new Date().toISOString(), stale: false };
  } catch (error) {
    if (cached) {
      return { days: cached.days, fetchedAt: cached.fetchedAt.toISOString(), stale: true };
    }
    throw error;
  }
}

export const prayer = {
  /** Prayer times for Auburn NSW: today plus the rest of the published month. */
  times: base
    .input(z.object({ refresh: z.boolean().optional() }).optional())
    .handler(async ({ input }) => {
      const { days: cachedDays, fetchedAt, stale } = await getDays(input?.refresh ?? false);
      const days = cachedDays.map(applyPublishedTimetable);
      return {
        location: { city: "Auburn", region: "NSW", country: "Australia", timeZone: "Australia/Sydney" },
        source: "Uploaded CSV timetable (24 June 2026–31 December 2027)",
        fetchedAt,
        stale,
        days,
      };
    }),
};
