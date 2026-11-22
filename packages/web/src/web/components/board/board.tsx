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
  /** Orientation link, rendered in the flow at the very bottom of the canvas. */
  toggleSlot?: ReactNode;
};

export function Board({ today, tomorrow, now, jummah, stale, toggleSlot }: BoardProps) {
  const slots = buildSlots(today, now);
  const nextUp = findNextUp(today, tomorrow, now);
  const gregorian = splitGregorian(today.gregorianLong);
  const friday = isFriday(today);
  const quiet = showQuietReminder(today, now);

  return (
    <div className={`relative flex h-full w-full flex-col px-14 ${quiet ? "pb-4 pt-6" : "pb-10 pt-14"}`}>
      {/* Header */}
      <header className="rise flex flex-col items-center gap-4">
        <img
          src="/images/logo-white.png"
          alt="Auburn Gallipoli Mosque"
          /* Deliberately stretched: twice the width its 1400x1241 source would give at this height. */
          style={{ height: 150, width: 338 }}
          className="opacity-95 drop-shadow-[0_10px_40px_rgba(226,183,87,0.18)]"
        />
        <h1
          className="whitespace-nowrap font-display font-bold uppercase leading-none text-gold-400"
          style={{ fontSize: 40, letterSpacing: "0.13em" }}
        >
          Auburn Gallipoli Mosque
        </h1>
        <span
          className="font-sans font-extrabold uppercase leading-none text-ink-500"
          style={{ fontSize: 20, letterSpacing: "0.34em" }}
        >
          Namaz Vakitleri · Prayer Times
        </span>
        <GoldRule width={620} />
      </header>

      {/* Dates */}
      <div
        className="rise mt-7 flex items-center justify-between"
        style={{ animationDelay: "80ms" }}
      >
        <div className="flex flex-col gap-1.5">
          <span className="whitespace-nowrap font-display font-bold leading-none text-ink-50" style={{ fontSize: 30 }}>
            {gregorian.day}
            <span className="text-ink-500"> · {gregorian.weekday}</span>
          </span>
          <span
            className="font-sans font-extrabold uppercase leading-none text-ink-500"
            style={{ fontSize: 18, letterSpacing: "0.16em" }}
          >
            {englishDate(today.gregorianLong)}
          </span>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className="whitespace-nowrap font-display font-bold leading-none text-gold-200" style={{ fontSize: 30 }}>
            {today.hijriLong}
          </span>
          <span
            className="font-sans font-extrabold uppercase leading-none text-ink-500"
            style={{ fontSize: 18, letterSpacing: "0.16em" }}
          >
            {englishHijri(today.hijriLong)} AH
          </span>
        </div>
      </div>

      {/* Clock + countdown */}
      <section
        className="rise mt-5 flex items-end justify-between gap-8 rounded-[18px] border border-navy-700/60 bg-navy-900/55 px-12 py-7"
        style={{ animationDelay: "160ms" }}
      >
        <div className="flex flex-col gap-2">
          <span
            className="font-sans font-extrabold uppercase leading-none text-ink-500"
            style={{ fontSize: 18, letterSpacing: "0.28em" }}
          >
            Sydney
          </span>
          <div className="flex items-start">
            <span
              className="tnum font-sans font-bold leading-[0.85] text-ink-50"
              style={{ fontSize: 132 }}
            >
              {now.hour}:{now.minute}
            </span>
          </div>
        </div>

        {nextUp && (
          <div className="flex shrink-0 flex-col items-end gap-3 pb-1">
            <span className="whitespace-nowrap font-display font-bold leading-none text-gold-200" style={{ fontSize: 34 }}>
              {nextUp.tr}
              <span className="text-ink-500"> · {nextUp.en}</span>
            </span>
            <span
              className="tnum whitespace-nowrap font-sans font-extrabold leading-none text-gold-400"
              style={{ fontSize: 58 }}
            >
              {formatRemaining(nextUp.remaining)}
            </span>
          </div>
        )}
      </section>

      {/* Prayer list */}
      <section className="mt-5 flex flex-col gap-[13px]">
        {slots.map((slot, index) => (
          <PrayerRow key={slot.key} slot={slot} index={index} height={192} />
        ))}
      </section>

      {/* Jummah */}
      <section
        className="rise mt-5 flex items-center justify-between rounded-[16px] border px-12 py-5"
        style={{
          animationDelay: "560ms",
          borderColor: friday ? "rgba(226,183,87,0.55)" : "rgba(226,183,87,0.22)",
          background: friday
            ? "linear-gradient(90deg, rgba(226,183,87,0.16), rgba(26,37,96,0.6))"
            : "rgba(17,26,69,0.55)",
        }}
      >
        <div className="flex flex-col">
          <span
            className="whitespace-nowrap font-display font-bold leading-none text-gold-400"
            style={{ fontSize: 34 }}
          >
            Cuma · Jummah
          </span>
        </div>
        <div className="flex items-center gap-10">
          <div className="flex flex-col items-end gap-1.5">
            <span
              className="font-sans font-extrabold uppercase leading-none text-ink-500"
              style={{ fontSize: 18, letterSpacing: "0.18em" }}
            >
              1st Iqamah
            </span>
            <span
              className="tnum font-sans font-bold leading-none text-ink-50"
              style={{ fontSize: 52 }}
            >
              {jummah.first}
            </span>
          </div>
          <span className="h-14 w-px bg-navy-700" />
          <div className="flex flex-col items-end gap-1.5">
            <span
              className="font-sans font-extrabold uppercase leading-none text-ink-500"
              style={{ fontSize: 18, letterSpacing: "0.18em" }}
            >
              2nd Iqamah
            </span>
            <span
              className="tnum font-sans font-bold leading-none text-ink-50"
              style={{ fontSize: 52 }}
            >
              {jummah.second}
            </span>
          </div>
        </div>
      </section>

      {stale && (
        <div className="mt-4 text-center">
          <span
            className="font-sans font-extrabold uppercase leading-none text-gold-400"
            style={{ fontSize: 17, letterSpacing: "0.22em" }}
          >
            Son bilinen veriler · Offline copy
          </span>
        </div>
      )}

      {quiet && <QuietReminder className="mt-2" />}

      {/* Orientation link — in the flow, so it can never overlap content */}
      <div className="mt-auto flex justify-center pt-3">{toggleSlot}</div>
    </div>
  );
}
