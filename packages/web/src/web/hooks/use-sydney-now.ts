import { useEffect, useState } from "react";

export type SydneyNow = {
  /** YYYY-MM-DD in Australia/Sydney. */
  date: string;
  /** Minutes since midnight, Sydney local. */
  minutes: number;
  hour: string;
  minute: string;
  second: string;
  /** Seconds since midnight — used for the countdown. */
  seconds: number;
};

const formatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Australia/Sydney",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

/**
 * `?now=HH:MM` or `?now=HH:MM:SS` overrides the clock, then ticks forward from
 * there — the only practical way to inspect a prayer's athan-to-Kamet window,
 * which can be as short as two minutes. Absent the parameter this is inert.
 */
function readOffset(): number {
  if (typeof window === "undefined") return 0;
  const raw = new URLSearchParams(window.location.search).get("now");
  if (!raw) return 0;
  const [h, m, s] = raw.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  const target = h * 3600 + m * 60 + (Number.isFinite(s) ? s : 0);
  const parts = formatter.formatToParts(new Date());
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? "0");
  return target - (get("hour") * 3600 + get("minute") * 60 + get("second"));
}

let offsetSeconds: number | null = null;

export function readSydneyNow(): SydneyNow {
  offsetSeconds ??= readOffset();
  const parts = formatter.formatToParts(new Date(Date.now() + offsetSeconds * 1000));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  const hour = get("hour") === "24" ? "00" : get("hour");
  const minute = get("minute");
  const second = get("second");
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: Number(hour) * 60 + Number(minute),
    seconds: Number(hour) * 3600 + Number(minute) * 60 + Number(second),
    hour,
    minute,
    second,
  };
}

/** Ticks once a second, always in Australia/Sydney regardless of the TV's clock. */
export function useSydneyNow(): SydneyNow {
  const [now, setNow] = useState<SydneyNow>(() => readSydneyNow());

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      setNow(readSydneyNow());
      // Re-align to the next wall-clock second so digits flip cleanly.
      frame = window.setTimeout(tick, 1000 - (Date.now() % 1000));
    };
    frame = window.setTimeout(tick, 1000 - (Date.now() % 1000));
    return () => window.clearTimeout(frame);
  }, []);

  return now;
}
