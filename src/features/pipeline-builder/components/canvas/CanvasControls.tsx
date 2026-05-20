"use client";

import { Undo, Redo, Network, Minus, Plus, Lock, Maximize2, Map } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

interface Props {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onAutoLayout?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  /** When true (e.g. nothing selected), the bar is always visible. */
  forceVisible?: boolean;
}

/** Floating vertical control bar pinned at the right edge of the canvas.
 *  It auto-hides when an expanded node panel would overlap it. */
export function CanvasControls({ zoom, onZoomIn, onZoomOut, onZoomReset, onAutoLayout, onUndo, onRedo }: Props) {
  const barRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(true);

  // Recompute overlap whenever something on the canvas moves: scroll, resize, node drags.
  useLayoutEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    function check() {
      if (!barRef.current) return;
      const barRect = barRef.current.getBoundingClientRect();
      const expanded = document.querySelector<HTMLElement>("[data-expanded-node]");
      if (!expanded) {
        setVisible(true);
        return;
      }
      const er = expanded.getBoundingClientRect();
      const intersects =
        er.right > barRect.left &&
        er.left < barRect.right &&
        er.bottom > barRect.top &&
        er.top < barRect.bottom;
      setVisible(!intersects);
    }

    check();

    // Watch the canvas viewport for scroll / size changes.
    const viewport = bar.closest<HTMLElement>(".relative") ?? document.body;
    const onScroll = () => check();
    viewport.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", check);

    // Watch the expanded node's size + position via MutationObserver (style attr changes when dragged).
    const moEl = document.querySelector("[data-expanded-node]");
    const mo = moEl
      ? new MutationObserver(check)
      : null;
    if (moEl && mo) mo.observe(moEl, { attributes: true, attributeFilter: ["style", "class"] });

    // Also poll briefly during interactive drags — cheap and works around RAF-driven transform updates.
    const poll = window.setInterval(check, 200);

    return () => {
      viewport.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", check);
      mo?.disconnect();
      window.clearInterval(poll);
    };
  });

  return (
    <div
      ref={barRef}
      aria-hidden={!visible}
      className={`pointer-events-auto absolute right-4 top-1/2 z-10 flex -translate-y-1/2 flex-col items-center gap-0.5 rounded-xl border border-border bg-surface-0/95 px-1.5 py-1.5 shadow-md backdrop-blur transition-opacity duration-150 ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <IconBtn onClick={onUndo ?? (() => {})} title="Undo"><Undo className="h-3.5 w-3.5" /></IconBtn>
      <IconBtn onClick={onRedo ?? (() => {})} title="Redo"><Redo className="h-3.5 w-3.5" /></IconBtn>
      <Divider />
      <IconBtn onClick={onAutoLayout ?? (() => {})} title="Auto layout"><Network className="h-3.5 w-3.5" /></IconBtn>
      <Divider />
      <IconBtn onClick={onZoomIn} title="Zoom in"><Plus className="h-3.5 w-3.5" /></IconBtn>
      <button
        onClick={onZoomReset}
        className="rounded-md px-1.5 py-1 text-[10px] font-mono font-semibold text-text-secondary transition-colors hover:bg-surface-2"
        title="Reset zoom"
      >
        {Math.round(zoom * 100)}%
      </button>
      <IconBtn onClick={onZoomOut} title="Zoom out"><Minus className="h-3.5 w-3.5" /></IconBtn>
      <Divider />
      <IconBtn onClick={onZoomReset} title="Fit view"><Maximize2 className="h-3.5 w-3.5" /></IconBtn>
      <IconBtn onClick={() => {}} title="Lock canvas"><Lock className="h-3.5 w-3.5" /></IconBtn>
      <IconBtn onClick={() => {}} title="Minimap"><Map className="h-3.5 w-3.5" /></IconBtn>
    </div>
  );
}

function Divider() {
  return <span className="my-0.5 h-px w-4 bg-border" />;
}

function IconBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex h-7 w-7 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary"
    >
      {children}
    </button>
  );
}
