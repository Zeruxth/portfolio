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
    // home is the root, and its frame shows the logo tab alone — going there
    // closes everything else rather than leaving tabs standing behind it
    if (current === "home") {
      setTabs((open) => (open.length ? [] : open));
      return;
    }
    setTabs((open) => (open.includes(current) ? open : [...open, current]));
  }, [current]);

  const close = useCallback(
    (key: SectionKey) => {
      const i = tabs.indexOf(key);
      if (i === -1) return;
      const next = tabs.filter((k) => k !== key);
      setTabs(next);

      // Navigate OUTSIDE the state updater: React runs updaters during render,
      // and routing from there updates the Router mid-render.
      if (key === current) {
        const fallback = next[i - 1] ?? next[next.length - 1];
        const target = fallback
          ? SECTIONS.find((s) => s.key === fallback)?.href ?? "/"
          : "/";
        router.push(target);
      }
    },
    [tabs, current, router],
  );

  const value = useMemo(() => ({ tabs, close }), [tabs, close]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTabs() {
  return useContext(Ctx);
}
