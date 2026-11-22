import { useLayoutEffect, useRef, useState } from "react";

export const QUIET_REMINDER = "Prayer time, please remain quiet, keep your children next to you";

/** Two identical groups translate one group-width, making the loop seamless. */
export function QuietReminder({ className = "" }: { className?: string }) {
  const group = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState(40);

  useLayoutEffect(() => {
    const node = group.current;
    if (!node) return;
    const measure = () => setDuration(node.scrollWidth / 45);
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    measure();
    return () => observer.disconnect();
  }, []);

  return (
    <aside className={`quiet-reminder ${className}`} aria-label={QUIET_REMINDER}>
      <div className="quiet-reminder-track" aria-hidden="true" style={{ animationDuration: `${duration}s` }}>
        <div ref={group} className="quiet-reminder-group"><span>{QUIET_REMINDER}</span><span>{QUIET_REMINDER}</span></div>
        <div className="quiet-reminder-group"><span>{QUIET_REMINDER}</span><span>{QUIET_REMINDER}</span></div>
      </div>
      <div className="quiet-reminder-static" aria-hidden="true">{QUIET_REMINDER}</div>
    </aside>
  );
}