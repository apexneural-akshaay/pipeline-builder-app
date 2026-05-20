"use client";

interface Props {
  params: Record<string, string | number>;
  onChange: (key: string, value: string) => void;
}

const HP_DEFS: Array<{ key: string; label: string; hint: string; min: number; max: number; step: number; def: number; unit?: string }> = [
  { key: "learningRate",     label: "Learning rate",     hint: "Optimizer step size",  min: 0.0001, max: 0.01, step: 0.0001, def: 0.001 },
  { key: "batchSize",        label: "Batch size",        hint: "Samples per step",      min: 4,      max: 128,  step: 4,      def: 32 },
  { key: "globalConfidence", label: "Global confidence", hint: "Detector threshold",    min: 0.1,    max: 0.95, step: 0.05,   def: 0.45 },
  { key: "maxFps",           label: "Max FPS",           hint: "Frame cap",             min: 1,      max: 60,   step: 1,      def: 25, unit: "fps" },
];

export function ParamsTab({ params, onChange }: Props) {
  return (
    <div className="space-y-3 p-4">
      {HP_DEFS.map((h) => {
        const v = params[h.key] !== undefined ? Number(params[h.key]) : h.def;
        const pct = ((v - h.min) / (h.max - h.min)) * 100;
        return (
          <div key={h.key} className="rounded-md border border-border bg-surface-0 px-3 py-2.5">
            <div className="mb-1.5 flex items-baseline justify-between">
              <div>
                <div className="text-[11px] font-semibold text-text-primary">{h.label}</div>
                <div className="text-[10px] text-text-muted">{h.hint}</div>
              </div>
              <span className="rounded-md bg-accent/10 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-accent">
                {v}{h.unit ? ` ${h.unit}` : ""}
              </span>
            </div>
            <div className="relative">
              <input
                type="range"
                min={h.min}
                max={h.max}
                step={h.step}
                value={v}
                onChange={(e) => onChange(h.key, e.target.value)}
                className="w-full accent-[var(--accent)]"
                style={{
                  background: `linear-gradient(to right, var(--accent) ${pct}%, var(--surface-3) ${pct}%)`,
                }}
              />
              <div className="mt-0.5 flex justify-between text-[9px] text-text-disabled">
                <span>{h.min}</span>
                <span>{h.max}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
