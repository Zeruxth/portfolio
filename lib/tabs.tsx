"use client";

import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { SECTIONS, sectionForPath, type SectionKey } from "./sections";

/**
 * Tabs accumulate as you navigate, browser-style. Closing one steps back to the
 * tab before it. Home is not a tab — it is the logo, and it never closes.
 */
interface TabsState {
  tabs: SectionKey[];
  close: (key: SectionKey) => void;
}

const Ctx = createContext<TabsState>({ tabs: [], close: () => {} });

export function TabsProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [tabs, setTabs] = useState<SectionKey[]>([]);

  const current = sectionForPath(pathname).key;

  useEffect(() => {
    if (current === "home") return;
    setTabs((open) => (open.includes(current) ? open : [...open, current]));
  }, [current]);

  const close = useCallback(
    (key: SectionKey) => {
      setTabs((open) => {
        const i = open.indexOf(key);
        if (i === -1) return open;
        const next = open.filter((k) => k !== key);
        // closing the tab you are on steps back to the one before it
        if (key === current) {
          const fallback = next[i - 1] ?? next[next.length - 1];
          const target = fallback
            ? SECTIONS.find((s) => s.key === fallback)?.href ?? "/"
            : "/";
          router.push(target);
        }
        return next;
      });
    },
    [current, router],
  );

  const value = useMemo(() => ({ tabs, close }), [tabs, close]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTabs() {
  return useContext(Ctx);
}
