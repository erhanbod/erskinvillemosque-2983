export function GoldRule({ width = 520 }: { width?: number }) {
  return (
    <div className="flex items-center justify-center gap-4" style={{ width }}>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-gold-400/55" />
      <span className="size-2 rotate-45 bg-gold-400/80" />
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-gold-400/55" />
    </div>
  );
}

export function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-2 border-r border-navy-700/60 last:border-r-0">
      <span
        className="font-sans font-extrabold uppercase leading-none text-ink-500"
        style={{ fontSize: 18, letterSpacing: "0.18em" }}
      >
        {label}
      </span>
      <span className="tnum font-sans font-extrabold leading-none text-ink-50" style={{ fontSize: 30 }}>
        {value}
      </span>
    </div>
  );
}
