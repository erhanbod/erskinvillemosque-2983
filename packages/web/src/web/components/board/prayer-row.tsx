import type { Slot } from "../../lib/prayer-board";

const STATUS_STYLES: Record<Slot["status"], string> = {
  past: "border-navy-700/50 bg-navy-900/40 opacity-55",
  upcoming: "border-navy-700/60 bg-navy-900/50",
  next: "border-gold-400/40 bg-navy-800 breathe",
  active: "border-gold-400/70 bg-navy-800 breathe",
};

/**
 * Fajr's athan-to-Kamet window outlives the 25-minute "active" highlight, so a
 * glowing row would otherwise fade to "past" grey mid-gathering. Hold it at the
 * lit treatment for as long as the glow runs.
 */
const GLOW_PAST_STYLES = "border-gold-400/70 bg-navy-800";

type PrayerRowProps = {
  slot: Slot;
  index: number;
  /** Row height in canvas px. Portrait default 158. */
  height?: number;
  /** Multiplier applied to every font size, for tighter layouts. */
  fontScale?: number;
};

export function PrayerRow({ slot, index, height = 158, fontScale = 1 }: PrayerRowProps) {
  const highlighted = slot.status === "next" || slot.status === "active" || slot.glow;
  const fs = (size: number) => Math.round(size * fontScale);
  const shell =
    slot.glow && slot.status === "past" ? GLOW_PAST_STYLES : STATUS_STYLES[slot.status];

  return (
    <div
      className={`rise relative flex items-center justify-between overflow-hidden rounded-[14px] border px-10 ${shell}`}
      style={{ height, animationDelay: `${120 + index * 60}ms` }}
    >
      {/* Full-bleed accent bar. */}
      <span
        className={`absolute inset-y-0 left-0 z-20 w-[5px] ${highlighted ? "bg-gold-400" : "bg-transparent"}`}
      />

      <div className="flex flex-col gap-1.5">
        <span
          className={`font-display font-bold leading-none ${highlighted ? "text-gold-200" : "text-ink-50"}`}
          /* Matched to the athan time's 74px so the two columns read as equals. */
          style={{ fontSize: fs(74) }}
        >
          {slot.tr}
        </span>
        <span
          className="font-sans font-extrabold uppercase leading-none text-ink-500"
          style={{ fontSize: fs(26), letterSpacing: "0.18em" }}
        >
          {slot.en}
        </span>
      </div>

      <div className="flex flex-col items-end gap-2">
        <span
          className={`tnum font-sans font-bold leading-[0.9] ${highlighted ? "text-gold-400" : "text-ink-50"}`}
          style={{ fontSize: fs(74) }}
        >
          {slot.time}
        </span>
        <span
          className="tnum flex items-baseline gap-3 font-sans font-bold leading-[0.9] text-ink-300"
          style={{ fontSize: fs(74) }}
        >
          {slot.cemaat ? (
            <>
              <span
                className="font-sans font-extrabold uppercase text-ink-500"
                style={{ fontSize: fs(28), letterSpacing: "0.12em" }}
              >
                Kamet
              </span>
              {slot.cemaat}
            </>
          ) : null}
        </span>
      </div>

      {/* Travelling border glow: athan to Kamet. Drawn over the row's own border. */}
      {slot.glow && (
        <svg className="glow-track" width="100%" height="100%" aria-hidden="true">
          <rect className="glow-arc" width="100%" height="100%" rx="11" ry="11" pathLength="100" />
          <rect className="glow-core" width="100%" height="100%" rx="11" ry="11" pathLength="100" />
        </svg>
      )}
    </div>
  );
}
