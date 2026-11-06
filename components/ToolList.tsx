"use client";

import { useState } from "react";
import type { Tool, ToolAction } from "@/content/tools";
import { placeholderTile } from "@/lib/placeholder";
import c from "./CaseStudy.module.css";
import s from "./ToolList.module.css";

// files live under /public, which Pages serves below the base path
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** A way to get the tool, set as a case study's "Link to the project". */
function Action({ action }: { action: ToolAction }) {
  const external = action.kind === "external";
  return (
    <a
      className={c.link}
      href={external ? action.href : `${BASE}${action.href}`}
      // every tool opens in a new tab, so the portfolio stays where you left it
      target="_blank"
      rel="noopener noreferrer"
      {...(action.kind === "download" && { download: true })}
    >
      {action.label}
    </a>
  );
}

/** The cover, the few lines and the ways to get it — beside the names, or under one on a phone. */
function Detail({ tool, at }: { tool: Tool; at: number }) {
  return (
    <>
      <div
        className={s.cover}
        role="img"
        aria-label={`${tool.title} cover`}
        style={{
          backgroundImage: tool.image ? `url('${BASE}${tool.image}')` : placeholderTile(at * 2 + 1),
        }}
      />
      <div className={s.text}>
        <div className={s.body}>
          <p className={s.desc}>{tool.description}</p>
          <div className={s.actions}>
            {tool.actions.map((a) => (
              <Action key={a.label} action={a} />
            ))}
          </div>
        </div>
        <ul className={s.meta}>
          <li>{tool.platform}</li>
          <li>{tool.year}</li>
        </ul>
      </div>
    </>
  );
}

/**
 * The names on the left, the hovered tool on the right: its cover, a few lines
 * and the ways to get it. There are no inner pages.
 *
 * A phone has no room beside the names, so there each name is a row that opens
 * its tool underneath it, the way a Projects row opens.
 */
export default function ToolList({ tools }: { tools: Tool[] }) {
  const [at, setAt] = useState(0);
  // the phone's open row; none until one is tapped
  const [open, setOpen] = useState<number | null>(null);
  const tool = tools[at];

  return (
    <div className={s.index}>
      <div className={s.names}>
        {tools.map((t, i) => (
          <div key={t.slug} className={s.item} data-open={open === i}>
            <div
              className={s.name}
              data-on={i === at}
              style={{ animationDelay: `${i * 55}ms` }}
              tabIndex={0}
              role="button"
              aria-expanded={open === i}
              onPointerEnter={() => setAt(i)}
              onFocus={() => setAt(i)}
              onClick={() => setOpen(open === i ? null : i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setOpen(open === i ? null : i);
                }
              }}
            >
              <h2 className={s.title}>{t.title}</h2>
              <span className={s.kind}>{t.kind}</span>
            </div>
            <div className={s.reveal} inert={open !== i}>
              <div className={s.revealIn}>
                <Detail tool={t} at={i} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={s.detail} key={tool.slug}>
        <Detail tool={tool} at={at} />
      </div>
    </div>
  );
}
