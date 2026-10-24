"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
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

/**
 * The bar is the route, nothing more: it shows only the tabs on the way to the
 * page you are on, so going back (or up) closes the tab you left.
 */
export function TabsProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const currentId = tabForPath(pathname)?.id ?? null;
  // rebuilt only when the route changes, so the bar's keys stay put
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const tabs = useMemo(() => tabsForPath(pathname), [currentId]);

  const close = useCallback(
    (id: string) => {
      const i = tabs.findIndex((t) => t.id === id);
      if (i === -1) return;
      // closing a tab closes everything opened from it, landing on its parent
      router.push(tabs[i - 1]?.href ?? "/");
    },
    [tabs, router],
  );

  const value = useMemo(() => ({ tabs, close }), [tabs, close]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTabs() {
  return useContext(Ctx);
}
