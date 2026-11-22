import type { Orientation } from "../../hooks/use-orientation";

/**
 * Plain text link, no chrome. Always rendered inside the board layout (never
 * fixed to the viewport) so it can't land on top of content on a TV whose
 * aspect ratio differs from the design canvas.
 */
export function OrientationToggle({
  orientation,
  onToggle,
  fontSize = 12,
}: {
  orientation: Orientation;
  onToggle: () => void;
  fontSize?: number;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="cursor-pointer bg-transparent font-sans font-extrabold uppercase leading-none text-gold-200/70 underline decoration-gold-400/40 decoration-1 underline-offset-4 opacity-40 transition hover:text-gold-200 hover:decoration-gold-400 hover:opacity-100"
      style={{ fontSize, letterSpacing: "0.24em" }}
    >
      {orientation === "portrait" ? "Landscape" : "Portrait"}
    </button>
  );
}
