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

/**
 * The names on the left, the hovered tool on the right: its cover, a few lines
 * and the ways to get it. There are no inner pages.
 */
export default function ToolList({ tools }: { tools: Tool[] }) {
  const [at, setAt] = useState(0);
  const tool = tools[at];

  return (
    <div className={s.index}>
      <div className={s.names}>
        {tools.map((t, i) => (
          <div
            key={t.slug}
            className={s.name}
            data-on={i === at}
            style={{ animationDelay: `${i * 55}ms` }}
            tabIndex={0}
            onPointerEnter={() => setAt(i)}
            onFocus={() => setAt(i)}
          >
            <h2 className={s.title}>{t.title}</h2>
            <span className={s.kind}>{t.kind}</span>
          </div>
        ))}
      </div>

      <div className={s.detail} key={tool.slug}>
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
      </div>
    </div>
  );
}
