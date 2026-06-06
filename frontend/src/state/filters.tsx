import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { ModeltellData, Tier } from "../types";

interface FilterState {
  /** Model IDs currently enabled (visible across all sections). */
  activeModels: Set<string>;
  toggleModel: (id: string) => void;
  setTier: (tier: Tier, on: boolean) => void;
  isTierFullyOn: (tier: Tier) => boolean;
  reset: () => void;
  /** Convenience: ordered list of enabled model IDs. */
  enabledIds: string[];
}

const Ctx = createContext<FilterState | null>(null);

export function FilterProvider({ data, children }: { data: ModeltellData; children: ReactNode }) {
  const allIds = useMemo(() => data.index.models.map((m) => m.id), [data]);
  const tierOf = useMemo(
    () => Object.fromEntries(data.index.models.map((m) => [m.id, m.tier])) as Record<string, Tier>,
    [data]
  );
  const [activeModels, setActiveModels] = useState<Set<string>>(() => new Set(allIds));

  const value = useMemo<FilterState>(() => {
    const toggleModel = (id: string) =>
      setActiveModels((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });

    const setTier = (tier: Tier, on: boolean) =>
      setActiveModels((prev) => {
        const next = new Set(prev);
        for (const id of allIds) {
          if (tierOf[id] === tier) on ? next.add(id) : next.delete(id);
        }
        return next;
      });

    const isTierFullyOn = (tier: Tier) =>
      allIds.filter((id) => tierOf[id] === tier).every((id) => activeModels.has(id));

    return {
      activeModels,
      toggleModel,
      setTier,
      isTierFullyOn,
      reset: () => setActiveModels(new Set(allIds)),
      enabledIds: allIds.filter((id) => activeModels.has(id)),
    };
  }, [activeModels, allIds, tierOf]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFilters(): FilterState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useFilters must be used within FilterProvider");
  return ctx;
}
