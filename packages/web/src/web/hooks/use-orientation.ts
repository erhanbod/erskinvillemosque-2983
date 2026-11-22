import { useCallback, useEffect, useState } from "react";

export type Orientation = "portrait" | "landscape";

const STORAGE_KEY = "auburn-board-orientation";

/** Portrait 1080x1920 (default) or landscape 1920x1080 design canvas. */
export const CANVAS: Record<Orientation, { width: number; height: number }> = {
  portrait: { width: 1080, height: 1920 },
  landscape: { width: 1920, height: 1080 },
};

function readStored(): Orientation {
  if (typeof window === "undefined") return "portrait";
  // ?view=landscape / ?view=portrait lets a TV be pointed straight at one view.
  const fromUrl = new URLSearchParams(window.location.search).get("view");
  if (fromUrl === "landscape" || fromUrl === "portrait") return fromUrl;
  return window.localStorage.getItem(STORAGE_KEY) === "landscape" ? "landscape" : "portrait";
}

/**
 * Remembers the chosen orientation so an always-on TV comes back up in the
 * same view after a power cycle or a browser reload.
 */
export function useOrientation() {
  const [orientation, setOrientation] = useState<Orientation>(readStored);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, orientation);
  }, [orientation]);

  const toggle = useCallback(() => {
    setOrientation((current) => (current === "portrait" ? "landscape" : "portrait"));
  }, []);

  return { orientation, canvas: CANVAS[orientation], toggle };
}
