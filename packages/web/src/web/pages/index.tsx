import { Board } from "../components/board/board";
import { BoardLandscape } from "../components/board/board-landscape";
import { OrientationToggle } from "../components/board/orientation-toggle";
import { useAutoRefresh } from "../hooks/use-auto-refresh";
import { useOrientation } from "../hooks/use-orientation";
import { useSydneyNow } from "../hooks/use-sydney-now";
import { useStageScale } from "../hooks/use-stage-scale";
import { usePrayerTimes } from "../queries/prayer";
import { findDay, jummahFor, nextDayOf } from "../lib/prayer-board";

function Index() {
  useAutoRefresh();
  const now = useSydneyNow();
  const query = usePrayerTimes(now.date);
  const { orientation, canvas, toggle } = useOrientation();
  const scale = useStageScale(canvas.width, canvas.height);

  const data = query.data;
  const today = data ? (findDay(data.days, now.date) ?? data.days[0]) : undefined;
  const tomorrow = data && today ? nextDayOf(data.days, today.date) : undefined;
  const landscape = orientation === "landscape";

  return (
    <div className="flex h-screen w-screen items-center justify-center overflow-hidden bg-navy-950">
      <div
        className="relative shrink-0 overflow-hidden"
        style={{
          width: canvas.width,
          height: canvas.height,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        {/* Layered navy field: gradient, gold glow behind the logo, vignette */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#111a45_0%,#0d1435_55%,#0a0f2b_100%)]" />
        <div
          className="absolute inset-x-0 top-0"
          style={{
            height: landscape ? 520 : 700,
            background: landscape
              ? "radial-gradient(46% 100% at 18% 0%, rgba(226,183,87,0.16), transparent 70%)"
              : "radial-gradient(60% 100% at 50% 0%, rgba(226,183,87,0.16), transparent 70%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            boxShadow: landscape
              ? "inset 0 0 200px 50px rgba(6,9,26,0.85)"
              : "inset 0 0 260px 60px rgba(6,9,26,0.85)",
          }}
        />

        <div className="relative h-full w-full">
          {today && data ? (
            landscape ? (
              <BoardLandscape
                today={today}
                tomorrow={tomorrow}
                now={now}
                jummah={jummahFor(today.date)}
                stale={data.stale}
                toggleSlot={
                  <OrientationToggle orientation={orientation} onToggle={toggle} fontSize={14} />
                }
              />
            ) : (
              <Board
                today={today}
                tomorrow={tomorrow}
                now={now}
                jummah={jummahFor(today.date)}
                stale={data.stale}
                toggleSlot={
                  <OrientationToggle orientation={orientation} onToggle={toggle} fontSize={11} />
                }
              />
            )
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-8">
              <img
                src="/images/logo-white.png"
                alt="Auburn Gallipoli Mosque"
                /* Stretched to match the board header. */
                style={{ height: 200, width: 451 }}
                className="animate-pulse opacity-90"
              />
              <span
                className="font-sans font-extrabold uppercase text-ink-500"
                style={{ fontSize: 24, letterSpacing: "0.3em" }}
              >
                {query.isError ? "Vakitler yüklenemedi · Retrying" : "Vakitler yükleniyor"}
              </span>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

export default Index;
