import type { ReactNode } from "react";
import type { PrayerDay } from "../../../api/routes/prayer";
import type { SydneyNow } from "../../hooks/use-sydney-now";
import {
  buildSlots,
  englishDate,
  englishHijri,
  findNextUp,
  formatRemaining,
  isFriday,
  splitGregorian,
  showQuietReminder,
} from "../../lib/prayer-board";
import { GoldRule } from "./board-chrome";
import { PrayerRow } from "./prayer-row";
import { QuietReminder } from "./quiet-reminder";

type BoardProps = {
  today: PrayerDay;
  tomorrow?: PrayerDay;
  now: SydneyNow;
  jummah: { first: string; second: string };
  stale: boolean;
  /** Orientation link, rendered between the clock panel and the Cuma section. */
  toggleSlot?: ReactNode;
};

/** 1920x1080 two-column variant of the portrait board. Same content. */
export function BoardLandscape({ today, tomorrow, now, jummah, stale, toggleSlot }: BoardProps) {
  const slots = buildSlots(today, now);
  const nextUp = findNextUp(today, tomorrow, now);
  const gregorian = splitGregorian(today.gregorianLong);
  const friday = isFriday(today);
  const quiet = showQuietReminder(today, now);

  return (
    <div className="relative flex h-full w-full flex-col px-12 py-11">
      <div className="flex min-h-0 flex-1 items-stretch gap-10">
      {/* Left column: identity, dates, clock, Jummah */}
      <div className="flex w-[700px] shrink-0 flex-col">
        <header className="rise flex flex-col items-center gap-3">
          <img
            src="/images/logo-white.png"
            alt="Auburn Gallipoli Mosque"
            style={{ height: 120, width: "auto" }}
            className="opacity-95 drop-shadow-[0_10px_40px_rgba(226,183,87,0.18)]"
          />
          <h1
            className="whitespace-nowrap font-display font-bold uppercase leading-none text-gold-400"
            style={{ fontSize: 29, letterSpacing: "0.12em" }}
          >
            Auburn Gallipoli Mosque
          </h1>
          <span
            className="whitespace-nowrap font-sans font-extrabold uppercase leading-none text-ink-500"
            style={{ fontSize: 15, letterSpacing: "0.24em" }}
          >
            Namaz Vakitleri · Prayer Times
          </span>
          <GoldRule width={520} />
        </header>

        {/* Dates */}
        <div
          className="rise mt-6 flex flex-col items-center gap-2.5"
          style={{ animationDelay: "80ms" }}
        >
          <div className="flex flex-col items-center gap-1">
            <span
              className="whitespace-nowrap font-display font-bold leading-none text-ink-50"
              style={{ fontSize: 27 }}
            >
              {gregorian.day}
              <span className="text-ink-500"> · {gregorian.weekday}</span>
            </span>
            <span
              className="whitespace-nowrap font-sans font-extrabold uppercase leading-none text-ink-500"
              style={{ fontSize: 15, letterSpacing: "0.16em" }}
            >
              {englishDate(today.gregorianLong)}
            </span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span
              className="whitespace-nowrap font-display font-bold leading-none text-gold-200"
              style={{ fontSize: 27 }}
            >
              {today.hijriLong}
            </span>
            <span
              className="whitespace-nowrap font-sans font-extrabold uppercase leading-none text-ink-500"
              style={{ fontSize: 15, letterSpacing: "0.16em" }}
            >
              {englishHijri(today.hijriLong)} AH
            </span>
          </div>
        </div>

        {/* Clock + countdown */}
        <section
          className="rise mt-6 flex flex-col items-center gap-5 rounded-[18px] border border-navy-700/60 bg-navy-900/55 px-10 py-7"
          style={{ animationDelay: "160ms" }}
        >
          <div className="flex flex-col items-center gap-2">
            <span
              className="font-sans font-extrabold uppercase leading-none text-ink-500"
              style={{ fontSize: 16, letterSpacing: "0.28em" }}
            >
              Sydney
            </span>
            <div className="flex items-start">
              <span
                className="tnum font-sans font-bold leading-[0.85] text-ink-50"
                style={{ fontSize: 118 }}
              >
                {now.hour}:{now.minute}
              </span>
            </div>
          </div>

          {nextUp && (
            <div className="flex flex-col items-center gap-2 border-t border-navy-700/60 pt-4">
              <span
                className="whitespace-nowrap font-display font-bold leading-none text-gold-200"
                style={{ fontSize: 28 }}
              >
                {nextUp.tr}
                <span className="text-ink-500"> · {nextUp.en}</span>
              </span>
              <span
                className="tnum whitespace-nowrap font-sans font-extrabold leading-none text-gold-400"
                style={{ fontSize: 56 }}
              >
                {formatRemaining(nextUp.remaining)}
              </span>
            </div>
          )}
        </section>

        {/* Orientation link, between the clock panel and the Cuma section */}
        <div className="flex flex-1 items-center justify-center py-6">{toggleSlot}</div>

        {/* Jummah */}
        <section
          className="rise flex items-center justify-between rounded-[16px] border px-9 py-5"
          style={{
            animationDelay: "560ms",
            borderColor: friday ? "rgba(226,183,87,0.55)" : "rgba(226,183,87,0.22)",
            background: friday
              ? "linear-gradient(90deg, rgba(226,183,87,0.16), rgba(26,37,96,0.6))"
              : "rgba(17,26,69,0.55)",
          }}
        >
          <span
            className="whitespace-nowrap font-display font-bold leading-none text-gold-400"
            style={{ fontSize: 27 }}
          >
            Cuma · Jummah
          </span>
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end gap-1.5">
              <span
                className="whitespace-nowrap font-sans font-extrabold uppercase leading-none text-ink-500"
                style={{ fontSize: 15, letterSpacing: "0.18em" }}
              >
                1st Iqamah
              </span>
              <span
                className="tnum font-sans font-bold leading-none text-ink-50"
                style={{ fontSize: 40 }}
              >
                {jummah.first}
              </span>
            </div>
            <span className="h-12 w-px bg-navy-700" />
            <div className="flex flex-col items-end gap-1.5">
              <span
                className="whitespace-nowrap font-sans font-extrabold uppercase leading-none text-ink-500"
                style={{ fontSize: 15, letterSpacing: "0.18em" }}
              >
                2nd Iqamah
              </span>
              <span
                className="tnum font-sans font-bold leading-none text-ink-50"
                style={{ fontSize: 40 }}
              >
                {jummah.second}
              </span>
            </div>
          </div>
        </section>

        {stale && (
          <div className="mt-3 text-center">
            <span
              className="font-sans font-extrabold uppercase leading-none text-gold-400"
              style={{ fontSize: 15, letterSpacing: "0.22em" }}
            >
              Son bilinen veriler · Offline copy
            </span>
          </div>
        )}
      </div>

      {/* Right column: the five prayer rows */}
      <section className="flex min-w-0 flex-1 flex-col justify-between">
        {slots.map((slot, index) => (
          <PrayerRow key={slot.key} slot={slot} index={index} height={180} fontScale={0.95} />
        ))}
      </section>
      </div>
      {quiet && <QuietReminder className="mt-3" />}
    </div>
  );
}
