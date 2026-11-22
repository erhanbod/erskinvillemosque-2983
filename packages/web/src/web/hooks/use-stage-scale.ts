import { useEffect, useState } from "react";

/**
 * Scales the fixed 1080x1920 design canvas to fit the viewport, so a browser
 * preview and a real portrait TV render identically.
 */
export function useStageScale(width: number, height: number) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const update = () =>
      setScale(Math.min(window.innerWidth / width, window.innerHeight / height));
    update();
    window.addEventListener("resize", update);
    const id = window.setInterval(update, 5000);
    return () => {
      window.removeEventListener("resize", update);
      window.clearInterval(id);
    };
  }, [width, height]);

  return scale;
}
