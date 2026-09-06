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
 * The tab a route opens, or null for home. Projects get their own tab, so the
 * bar reads logo / Selected Projects / <project name> as you go deeper.
 */
export function tabForPath(pathname: string): Tab | null {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/") return null;

  const slug = path.match(/^\/projects\/(.+)$/)?.[1];
  if (slug) {
    const project = PROJECTS.find((p) => p.slug === slug);
    return project
      ? { id: `project:${project.slug}`, label: project.title, href: `/projects/${project.slug}` }
      : null;
  }

  const section = SECTIONS.find((s) => s.href !== "/" && s.href === path);
  return section ? { id: section.key, label: section.label, href: section.href } : null;
}

interface TabsState {
  tabs: Tab[];
  close: (id: string) => void;
}

const Ctx = createContext<TabsState>({ tabs: [], close: () => {} });

export function TabsProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [tabs, setTabs] = useState<Tab[]>([]);

  const current = tabForPath(pathname);
  const currentId = current?.id ?? null;

  useEffect(() => {
    // home is the root, and its frame shows the logo tab alone — going there
    // closes everything else rather than leaving tabs standing behind it
    if (!current) {
      setTabs((open) => (open.length ? [] : open));
      return;
    }
    setTabs((open) =>
      open.some((t) => t.id === current.id) ? open : [...open, current],
    );
    // the id is what identifies the route; the object is rebuilt every render
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
