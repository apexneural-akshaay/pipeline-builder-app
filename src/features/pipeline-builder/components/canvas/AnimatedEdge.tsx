"use client";

interface Props {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  dashed?: boolean;
  selected?: boolean;
  hovered?: boolean;
  /** If true, this edge is not the focus - dim it. */
  dimmed?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onClick?: () => void;
  onDelete?: () => void;
}

/**
 * Calm by default: thin line, no constant animation, no glow.
 * Only the hovered/selected edge gets the emphasis treatment
 * (thicker stroke, glow, animated dot, delete button).
 */
export function AnimatedEdge({
  x1, y1, x2, y2, color, dashed, selected, hovered, dimmed,
  onMouseEnter, onMouseLeave, onClick, onDelete,
}: Props) {
  const dx = Math.max(Math.abs(x2 - x1) * 0.4, 50);
  const d = `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;

  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;

  const interactive = !!(onMouseEnter || onClick || onDelete);
  const emphasize = selected || hovered;

  // Baseline opacities - tuned to keep lots of edges readable
  const strokeOpacity = emphasize ? 1 : dimmed ? 0.2 : 0.6;
  const strokeWidth = emphasize ? 2.5 : 1.5;

  return (
    <g
      style={{
        pointerEvents: interactive ? "auto" : "none",
        cursor: interactive ? "pointer" : "default",
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      {/* Invisible wide hit area so the edge is easy to target */}
      {interactive && (
        <path d={d} fill="none" stroke="transparent" strokeWidth={16} />
      )}

      {/* Soft glow only when emphasized */}
      {emphasize && (
        <path d={d} fill="none" stroke={color} strokeWidth={6} opacity={0.18} />
      )}

      {/* Main stroke */}
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeOpacity={strokeOpacity}
        strokeDasharray={dashed ? "6 4" : undefined}
      />

      {/* Single animated dot - only when emphasized or the edge is actively being drawn */}
      {(emphasize || dashed) && !dimmed && (
        <circle r={3} fill={color}>
          <animateMotion dur="1.5s" repeatCount="indefinite" path={d} />
        </circle>
      )}

      {/* Delete button at midpoint on hover/select */}
      {emphasize && onDelete && (
        <g
          style={{ cursor: "pointer" }}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <circle cx={mx} cy={my} r={10} fill="var(--surface-0)" stroke={color} strokeWidth={1.5} />
          <circle cx={mx} cy={my} r={9} fill={color} opacity={0.92} />
          <path
            d={`M${mx - 3.5},${my - 3.5} L${mx + 3.5},${my + 3.5} M${mx + 3.5},${my - 3.5} L${mx - 3.5},${my + 3.5}`}
            stroke="#fff"
            strokeWidth={1.8}
            strokeLinecap="round"
          />
        </g>
      )}
    </g>
  );
}
