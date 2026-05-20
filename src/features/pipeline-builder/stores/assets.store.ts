import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AnyAsset,
  AssetKind,
  ModelAsset,
  TaskAsset,
  DatasetAsset,
  MetricAsset,
} from "../types/asset.types";
import { PREDEFINED_MODELS } from "../data/predefined-models";
import { PREDEFINED_TASKS } from "../data/predefined-tasks";
import { PREDEFINED_METRICS } from "../data/predefined-metrics";
import { PREDEFINED_DATASETS } from "../data/predefined-datasets";

interface AssetsState {
  models: ModelAsset[];
  tasks: TaskAsset[];
  datasets: DatasetAsset[];
  metrics: MetricAsset[];

  /** Asset CRUD */
  addAsset: (asset: AnyAsset) => void;
  updateAsset: (id: string, patch: Partial<AnyAsset>) => void;
  deleteAsset: (id: string) => void;
  duplicateAsset: (id: string) => string | undefined;
  getAsset: (id: string) => AnyAsset | undefined;
  getAssetsOfKind: (kind: AssetKind) => AnyAsset[];
  resetToBuiltIns: () => void;
}

const SEED = {
  models: PREDEFINED_MODELS,
  tasks: PREDEFINED_TASKS,
  datasets: PREDEFINED_DATASETS,
  metrics: PREDEFINED_METRICS,
};

export const useAssetsStore = create<AssetsState>()(
  persist(
    (set, get) => ({
      ...SEED,

      addAsset: (asset) =>
        set((state) => {
          switch (asset.kind) {
            case "model":   return { models:   [...state.models,   asset as ModelAsset] };
            case "task":    return { tasks:    [...state.tasks,    asset as TaskAsset] };
            case "dataset": return { datasets: [...state.datasets, asset as DatasetAsset] };
            case "metric":  return { metrics:  [...state.metrics,  asset as MetricAsset] };
          }
        }),

      updateAsset: (id, patch) =>
        set((state) => ({
          models:   state.models.map((m)   => (m.id === id   ? { ...m, ...(patch as ModelAsset) }   : m)),
          tasks:    state.tasks.map((t)    => (t.id === id   ? { ...t, ...(patch as TaskAsset) }    : t)),
          datasets: state.datasets.map((d) => (d.id === id   ? { ...d, ...(patch as DatasetAsset) } : d)),
          metrics:  state.metrics.map((m)  => (m.id === id   ? { ...m, ...(patch as MetricAsset) }  : m)),
        })),

      deleteAsset: (id) =>
        set((state) => ({
          models:   state.models.filter((m)   => m.id !== id || m.isBuiltIn),
          tasks:    state.tasks.filter((t)    => t.id !== id || t.isBuiltIn),
          datasets: state.datasets.filter((d) => d.id !== id || d.isBuiltIn),
          metrics:  state.metrics.filter((m)  => m.id !== id || m.isBuiltIn),
        })),

      duplicateAsset: (id) => {
        const asset = get().getAsset(id);
        if (!asset) return undefined;
        const newId = `${asset.kind}-${Date.now()}`;
        const copy: AnyAsset = {
          ...asset,
          id: newId,
          name: `${asset.name} (copy)`,
          isBuiltIn: false,
          createdAt: new Date().toISOString(),
        } as AnyAsset;
        get().addAsset(copy);
        return newId;
      },

      getAsset: (id) => {
        const s = get();
        return (
          s.models.find((a) => a.id === id) ||
          s.tasks.find((a) => a.id === id) ||
          s.datasets.find((a) => a.id === id) ||
          s.metrics.find((a) => a.id === id)
        );
      },

      getAssetsOfKind: (kind) => {
        const s = get();
        switch (kind) {
          case "model":   return s.models;
          case "task":    return s.tasks;
          case "dataset": return s.datasets;
          case "metric":  return s.metrics;
        }
      },

      resetToBuiltIns: () => set({ ...SEED }),
    }),
    {
      name: "vision-pipeline-assets",
      version: 5, // bumped: wipe all user-created custom models — user will build them dynamically
      migrate: (persistedState, fromVersion) => {
        const s = persistedState as Partial<AssetsState> | undefined;
        if (s && fromVersion < 5 && Array.isArray(s.models)) {
          s.models = s.models.filter((m) => m.isBuiltIn);
        }
        return s as AssetsState;
      },
      // Merge seed built-ins with persisted user assets on rehydrate
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AssetsState>;
        const keepUser = (persistedList: AnyAsset[] = []) => persistedList.filter((a) => !a.isBuiltIn);
        return {
          ...current,
          models:   [...current.models,   ...keepUser(p.models)],
          tasks:    [...current.tasks,    ...keepUser(p.tasks)],
          datasets: [...current.datasets, ...keepUser(p.datasets)],
          metrics:  [...current.metrics,  ...keepUser(p.metrics)],
        } as AssetsState;
      },
    },
  ),
);
