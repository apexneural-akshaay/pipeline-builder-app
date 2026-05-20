"use client";

import { HelpCircle } from "lucide-react";

interface Props {
  onClick?: () => void;
}

/** Floating "?" help button in the bottom-left of the editor. */
export function HelpButton({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      title="Help & shortcuts"
      className="pointer-events-auto absolute bottom-4 left-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-0 text-text-muted shadow-md transition-all hover:scale-110 hover:border-accent hover:text-accent"
    >
      <HelpCircle className="h-5 w-5" />
    </button>
  );
}
