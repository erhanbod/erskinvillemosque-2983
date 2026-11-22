import { useEffect } from "react";

import { readSydneyNow } from "./use-sydney-now";

/**
 * Keeps an unattended TV screen current without anyone touching the box.
 *
 * Two independent triggers, both ending in a full page reload:
 *
 * 1. Nightly reload at 03:00 Sydney time — clears any browser drift/leaks and
 *    picks up whatever is currently deployed, once a day, while nobody is looking.
 * 2. Build-version watch — every 15 minutes we re-fetch the app's own index.html
 *    with `cache: "no-store"` and compare the hashed main bundle it references
 *    against the bundle this page actually loaded. When a new version is
 *    published the hash changes and the screen reloads within 15 minutes.
 *    In dev both sides are `/src/web/main.tsx`, so nothing ever triggers.
 */

/** Nightly reload time, Sydney local. */
const NIGHTLY_HOUR = "03";
const NIGHTLY_MINUTE = "00";

/** How often to check for a newly published build. */
const VERSION_POLL_MS = 15 * 60 * 1000;

/** Don't reload within this long of the page opening — guards against loops. */
const MIN_UPTIME_MS = 5 * 60 * 1000;

/** The module script this page is running from, e.g. /assets/index-CGjCPffY.js */
function loadedBundle(): string | null {
  const scripts = Array.from(
    document.querySelectorAll<HTMLScriptElement>('script[type="module"][src]'),
  );
  const main = scripts.map((s) => s.getAttribute("src") ?? "").find((src) => src.length > 0);
  return main ? new URL(main, window.location.href).pathname : null;
}

/** The module script the freshly served index.html points at. */
async function publishedBundle(): Promise<string | null> {
  const response = await fetch(`/?v=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) return null;
  const html = await response.text();
  const match = html.match(/<script[^>]+type="module"[^>]+src="([^"]+)"/);
  if (!match) return null;
  return new URL(match[1], window.location.href).pathname;
}

export function useAutoRefresh() {
  useEffect(() => {
    const openedAt = Date.now();
    const current = loadedBundle();
    let reloading = false;

    const reload = (reason: string) => {
      if (reloading) return;
      if (Date.now() - openedAt < MIN_UPTIME_MS) return;
      reloading = true;
      console.info(`[board] reloading: ${reason}`);
      window.location.reload();
    };

    // 1. Nightly reload — checked every 20s so we can't miss the minute.
    const nightly = window.setInterval(() => {
      const now = readSydneyNow();
      if (now.hour === NIGHTLY_HOUR && now.minute === NIGHTLY_MINUTE) {
        reload("nightly 03:00 Sydney refresh");
      }
    }, 20_000);

    // 2. New build published — compare hashed bundle names.
    const checkVersion = async () => {
      if (!current) return;
      try {
        const published = await publishedBundle();
        if (published && published !== current) {
          reload(`new build published (${current} -> ${published})`);
        }
      } catch {
        // Offline or server restarting — keep showing the cached board.
      }
    };

    const version = window.setInterval(checkVersion, VERSION_POLL_MS);
    void checkVersion();

    return () => {
      window.clearInterval(nightly);
      window.clearInterval(version);
    };
  }, []);
}
