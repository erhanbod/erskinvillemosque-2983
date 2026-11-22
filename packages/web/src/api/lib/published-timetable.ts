import { TIMETABLE, TIMETABLE_DATES, type TimetableRow } from "../data/salah-timetable";
import type { PrayerDay } from "../routes/prayer";

/** Exact CSV row, or existing first/last covered row fallback outside coverage. */
export function timetableRow(date: string): TimetableRow {
  if (TIMETABLE[date]) return TIMETABLE[date];
  const first = TIMETABLE_DATES[0];
  const last = TIMETABLE_DATES[TIMETABLE_DATES.length - 1];
  return TIMETABLE[date < first ? first : last];
}

/** Reapply on every API response: stale cached times must never override a new CSV. */
export function applyPublishedTimetable(day: PrayerDay): PrayerDay {
  const [fajr, fajrKamet, dhuhr, dhuhrKamet, asr, asrKamet, maghrib, maghribKamet, isha, ishaKamet] =
    timetableRow(day.date);
  return {
    ...day,
    times: { ...day.times, imsak: fajr, ogle: dhuhr, ikindi: asr, aksam: maghrib, yatsi: isha },
    cemaat: { ...day.cemaat, imsak: fajrKamet, ogle: dhuhrKamet, ikindi: asrKamet, aksam: maghribKamet, yatsi: ishaKamet },
  };
}
