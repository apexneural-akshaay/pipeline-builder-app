"use client";

import { X, Download, Copy, Check, FileCode2, Loader2 } from "lucide-react";
import { useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  code: string;
  error: string | null;
  onDownload: () => void;
}

export function ExportPreviewModal({ open, onClose, code, error, onDownload }: Props) {
  const [copied, setCopied] = useState(false);
  if (!open) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
      <div className="flex h-[80vh] w-full max-w-4xl flex-col rounded-xl border border-border bg-surface-0 shadow-modal">
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-accent/30 bg-accent/10 text-accent">
              <FileCode2 className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Generated inference.py</h2>
              <p className="mt-0.5 text-[11px] text-text-muted">Assembled from snippet library. Read it, then download.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              disabled={!code}
              className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface-1 px-3 text-xs font-medium text-text-primary hover:bg-surface-2 disabled:opacity-40"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              onClick={onDownload}
              disabled={!code}
              className="flex h-8 items-center gap-1.5 rounded-md bg-accent px-3 text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-40"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </button>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-surface-2 hover:text-text-primary"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-auto bg-surface-1 p-0">
          {error ? (
            <div className="p-4">
              <div className="rounded-md border border-error/40 bg-error/10 p-3 text-xs text-error">
                <div className="mb-1 font-semibold">Compile failed</div>
                <pre className="whitespace-pre-wrap font-mono">{error}</pre>
              </div>
            </div>
          ) : !code ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-text-muted">
              <Loader2 className="h-5 w-5 animate-spin text-accent" />
              <span className="text-xs">Compiling pipeline...</span>
            </div>
          ) : (
            <div className="flex h-full">
              {/* Gutter line numbers */}
              <div
                aria-hidden
                className="select-none border-r border-border bg-surface-2 px-3 py-4 text-right font-mono text-[10px] leading-relaxed text-text-muted"
              >
                {code.split("\n").map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              <pre className="m-0 flex-1 overflow-auto whitespace-pre-wrap break-words p-4 font-mono text-xs leading-relaxed text-text-primary">
                {code}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
