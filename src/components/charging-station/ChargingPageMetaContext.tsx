import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type ChargingPageMeta = {
  dominantStation: string | null;
  capacityKw: number | null;
};

const defaultMeta: ChargingPageMeta = {
  dominantStation: null,
  capacityKw: null,
};

type Ctx = {
  meta: ChargingPageMeta;
  setMeta: (patch: Partial<ChargingPageMeta>) => void;
};

const ChargingPageMetaContext = createContext<Ctx | null>(null);

export function ChargingPageMetaProvider({ children }: { children: ReactNode }) {
  const [meta, setMetaState] = useState<ChargingPageMeta>(defaultMeta);

  const setMeta = useCallback((patch: Partial<ChargingPageMeta>) => {
    setMetaState((s) => ({ ...s, ...patch }));
  }, []);

  const value = useMemo(() => ({ meta, setMeta }), [meta, setMeta]);

  return <ChargingPageMetaContext.Provider value={value}>{children}</ChargingPageMetaContext.Provider>;
}

export function useChargingPageMeta(): Ctx {
  const ctx = useContext(ChargingPageMetaContext);
  if (!ctx) {
    throw new Error("useChargingPageMeta must be used within ChargingPageMetaProvider");
  }
  return ctx;
}
