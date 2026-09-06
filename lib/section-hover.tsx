"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { SectionKey } from "./sections";

interface HoverState {
  hovered: SectionKey | null;
  setHovered: (key: SectionKey | null) => void;
}

const Ctx = createContext<HoverState>({ hovered: null, setHovered: () => {} });

export function SectionHoverProvider({ children }: { children: ReactNode }) {
  const [hovered, setHovered] = useState<SectionKey | null>(null);
  const value = useMemo(() => ({ hovered, setHovered }), [hovered]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSectionHover() {
  return useContext(Ctx);
}
