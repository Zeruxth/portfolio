"use client";

import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { PROJECTS } from "@/content/projects";
import { SECTIONS } from "./sections";

export interface Tab {
  id: string;
  label: string;
  href: string;
}

/**
 * The tabs a route opens, outermost first; empty for home. A project opens its
 * section too, so the bar reads logo / Selected Projects / <project name>
 * however you arrived.
 */
export function tabsForPath(pathname: string): Tab[] {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/") return [];

  const slug = path.match(/^\/projects\/(.+)$/)?.[1];
  if (slug) {
    const project = PROJECTS.find((p) => p.slug === slug);
    if (!project) return [];
    return [
      ...tabsForPath("/projects"),
      { id: `project:${project.slug}`, label: project.title, href: `/projects/${project.slug}` },
    ];
  }

  const section = SECTIONS.find((s) => s.href !== "/" && s.href === path);
  return section ? [{ id: section.key, label: section.label, href: section.href }] : [];
}

/** The tab for the route itself, or null for home. */
export function tabForPath(pathname: string): Tab | null {
  return tabsForPath(pathname).at(-1) ?? null;
}

interface TabsState {
  tabs: Tab[];
  close: (id: string) => void;
}

const Ctx = createContext<TabsState>({ tabs: [], close: () => {} });

export function TabsProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  // seeded from the route, so the bar is already right in the server HTML
  const [tabs, setTabs] = useState<Tab[]>(() => tabsForPath(pathname));

  const chain = tabsForPath(pathname);
  const currentId = chain.at(-1)?.id ?? null;

  useEffect(() => {
    // home is the root, and its frame shows the logo tab alone — going there
    // closes everything else rather than leaving tabs standing behind it
    if (!chain.length) {
      setTabs((open) => (open.length ? [] : open));
      return;
    }
    setTabs((open) => {
      const missing = chain.filter((t) => !open.some((o) => o.id === t.id));
      return missing.length ? [...open, ...missing] : open;
    });
    // the id is what identifies the route; the objects are rebuilt every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId]);

  const close = useCallback(
    (id: string) => {
      const i = tabs.findIndex((t) => t.id === id);
      if (i === -1) return;
      const next = tabs.filter((t) => t.id !== id);
      setTabs(next);

      // Navigate OUTSIDE the state updater: React runs updaters during render,
      // and routing from there updates the Router mid-render.
      if (id === currentId) {
        const fallback = next[i - 1] ?? next[next.length - 1];
        router.push(fallback ? fallback.href : "/");
      }
    },
    [tabs, currentId, router],
  );

  const value = useMemo(() => ({ tabs, close }), [tabs, close]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTabs() {
  return useContext(Ctx);
}
