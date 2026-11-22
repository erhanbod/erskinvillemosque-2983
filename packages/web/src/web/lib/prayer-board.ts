import { JUMMAH_TIMETABLE, JUMMAH_DATES } from "../../api/data/jummah-timetable";
import type { PrayerDay } from "../../api/routes/prayer";
import type { SydneyNow } from "../hooks/use-sydney-now";

export type PrayerKey = "imsak" | "gunes" | "ogle" | "ikindi" | "aksam" | "yatsi";

export const PRAYERS: { key: PrayerKey; tr: string; en: string }[] = [
  { key: "imsak", tr: "Sabah", en: "Fajr" },
  { key: "ogle", tr: "Öğle", en: "Dhuhr" },
  { key: "ikindi", tr: "İkindi", en: "Asr" },
  { key: "aksam", tr: "Akşam", en: "Maghrib" },
  { key: "yatsi", tr: "Yatsı", en: "Isha" },
];

export type Slot = {
  key: PrayerKey;
  tr: string;
  en: string;
  time: string;
  cemaat: string | null;
  minutes: number;
  status: "past" | "active" | "next" | "upcoming";
  /** True between this prayer's athan and its Kamet — drives the rotating border glow. */
  glow: boolean;
};

export const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** Daily gathering reminder; Cuma sessions deliberately do not participate. */
export function showQuietReminder(day: PrayerDay, now: SydneyNow): boolean {
  return PRAYERS.some(({ key }) => {
    const kamet = day.cemaat[key];
    if (!kamet) return false;
    const start = (toMinutes(day.times[key]) - 5) * 60;
    const end = toMinutes(kamet) * 60;
    return now.seconds >= start && now.seconds < end;
  });
}

/** Minutes a prayer stays visually "in progress" after its adhan. */
const ACTIVE_WINDOW = 25;

export function findDay(days: PrayerDay[], date: string) {
  return days.find((d) => d.date === date);
}

export function nextDayOf(days: PrayerDay[], date: string) {
  const index = days.findIndex((d) => d.date === date);
  return index >= 0 ? days[index + 1] : undefined;
}

export function buildSlots(day: PrayerDay, now: SydneyNow): Slot[] {
  const raw = PRAYERS.map((p) => ({
    ...p,
    time: day.times[p.key],
    cemaat: day.cemaat[p.key],
    minutes: toMinutes(day.times[p.key]),
  }));

  const nextIndex = raw.findIndex((slot) => slot.minutes > now.minutes);

  return raw.map((slot, index) => {
    const isActive = now.minutes >= slot.minutes && now.minutes < slot.minutes + ACTIVE_WINDOW;
    let status: Slot["status"] = "upcoming";
    if (index === nextIndex) status = "next";
    else if (slot.minutes <= now.minutes) status = "past";
    if (isActive) status = "active";

    // The glow window follows the published Kamet, not the 25-minute highlight:
    // Fajr gathers for ~49 minutes, Maghrib for ~2.
    const kamet = slot.cemaat ? toMinutes(slot.cemaat) : slot.minutes + ACTIVE_WINDOW;
    const glow = now.minutes >= slot.minutes && now.minutes < kamet;

    return { ...slot, status, glow };
  });
}

export type NextUp = {
  tr: string;
  en: string;
  time: string;
  cemaat: string | null;
  /** Seconds until the adhan. */
  remaining: number;
  tomorrow: boolean;
};

export function findNextUp(
  day: PrayerDay,
  tomorrow: PrayerDay | undefined,
  now: SydneyNow,
): NextUp | null {
  const upcoming = PRAYERS.map((p) => ({
    ...p,
    time: day.times[p.key],
    cemaat: day.cemaat[p.key],
    seconds: toMinutes(day.times[p.key]) * 60,
  })).find((slot) => slot.seconds > now.seconds);

  if (upcoming) {
    return {
      tr: upcoming.tr,
      en: upcoming.en,
      time: upcoming.time,
      cemaat: upcoming.cemaat,
      remaining: upcoming.seconds - now.seconds,
      tomorrow: false,
    };
  }

  const source = tomorrow ?? day;
  const first = PRAYERS[0];
  return {
    tr: first.tr,
    en: first.en,
    time: source.times.imsak,
    cemaat: source.cemaat.imsak,
    remaining: toMinutes(source.times.imsak) * 60 + 86_400 - now.seconds,
    tomorrow: true,
  };
}

/** 4520 -> "1 sa 15 dk" (Turkish primary, matching the board's labels). */
export function formatRemaining(totalSeconds: number) {
  const seconds = Math.max(0, totalSeconds);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h} sa ${String(m).padStart(2, "0")} dk`;
  if (m > 0) return `${m} dk ${String(s).padStart(2, "0")} sn`;
  return `${s} sn`;
}

/** "26 Ağustos 2026 Çarşamba" -> { day: "26 Ağustos 2026", weekday: "Çarşamba" } */
export function splitGregorian(long: string) {
  const parts = long.trim().split(" ");
  if (parts.length < 4) return { day: long, weekday: "" };
  return { day: parts.slice(0, 3).join(" "), weekday: parts.slice(3).join(" ") };
}

const EN_MONTHS: Record<string, string> = {
  Ocak: "January",
  Şubat: "February",
  Mart: "March",
  Nisan: "April",
  Mayıs: "May",
  Haziran: "June",
  Temmuz: "July",
  Ağustos: "August",
  Eylül: "September",
  Ekim: "October",
  Kasım: "November",
  Aralık: "December",
};

const EN_WEEKDAYS: Record<string, string> = {
  Pazartesi: "Monday",
  Salı: "Tuesday",
  Çarşamba: "Wednesday",
  Perşembe: "Thursday",
  Cuma: "Friday",
  Cumartesi: "Saturday",
  Pazar: "Sunday",
};

export function englishDate(long: string) {
  const { day, weekday } = splitGregorian(long);
  const [d, month, year] = day.split(" ");
  const enMonth = EN_MONTHS[month] ?? month;
  const enWeekday = EN_WEEKDAYS[weekday] ?? weekday;
  return `${enWeekday} ${d} ${enMonth} ${year}`.trim();
}

const HIJRI_MONTHS: Record<string, string> = {
  Muharrem: "Muharram",
  Safer: "Safar",
  Rebiulevvel: "Rabi' al-awwal",
  Rebiulahir: "Rabi' al-thani",
  Cemaziyelevvel: "Jumada al-awwal",
  Cemaziyelahir: "Jumada al-thani",
  Recep: "Rajab",
  Şaban: "Sha'ban",
  Ramazan: "Ramadan",
  Şevval: "Shawwal",
  Zilkade: "Dhul-Qi'dah",
  Zilhicce: "Dhul-Hijjah",
};

export function englishHijri(long: string) {
  const [d, month, year] = long.split(" ");
  return `${d} ${HIJRI_MONTHS[month] ?? month} ${year}`;
}

export const isFriday = (day: PrayerDay) => day.weekday === 5;

const sydneyOffset = new Intl.DateTimeFormat("en-AU", {
  timeZone: "Australia/Sydney",
  timeZoneName: "longOffset",
});

/**
 * True when NSW daylight saving (AEDT, UTC+11) is in force on this date.
 * Reads the real zone offset rather than hard-coded changeover dates, so it
 * keeps working in future years. Noon UTC (late evening in Sydney) never
 * falls inside the 2–3am switch hour.
 */
export function isSydneyDaylightSaving(dateIso: string) {
  const zone = sydneyOffset
    .formatToParts(new Date(`${dateIso}T12:00:00Z`))
    .find((part) => part.type === "timeZoneName")?.value;
  return zone === "GMT+11:00";
}

/** Cuma sessions are authoritative CSV values, not derived from DST rules. */
export function jummahFor(dateIso: string) {
  const firstDate = JUMMAH_DATES[0];
  const lastDate = JUMMAH_DATES[JUMMAH_DATES.length - 1];
  const sessions = JUMMAH_TIMETABLE[dateIso] ??
    JUMMAH_TIMETABLE[dateIso < firstDate ? firstDate : lastDate];
  return { first: sessions[0], second: sessions[1] };
}
