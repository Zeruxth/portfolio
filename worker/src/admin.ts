/**
 * The leads dashboard: /admin serves the page, /admin/api/* reads and updates
 * submissions. Everything under /admin asks for the ADMIN_PASSWORD secret
 * (HTTP Basic auth; any username).
 */
import page from "./dashboard.html";

const STATUSES = ["new", "talking", "won", "not_relevant"] as const;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function handleAdmin(request: Request, env: Env, url: URL): Promise<Response> {
  if (!env.ADMIN_PASSWORD) {
    return new Response("Set the dashboard password first: npx wrangler secret put ADMIN_PASSWORD", {
      status: 503,
    });
  }
  if (!(await authorised(request, env.ADMIN_PASSWORD))) {
    return new Response("Password needed", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="AKI_WIP leads", charset="UTF-8"' },
    });
  }

  const headers = {
    "Cache-Control": "no-store",
    "X-Robots-Tag": "noindex",
    "X-Frame-Options": "DENY",
  };

  if (url.pathname === "/admin" || url.pathname === "/admin/") {
    return new Response(page, { headers: { ...headers, "Content-Type": "text/html; charset=utf-8" } });
  }

  if (url.pathname === "/admin/api/submissions" && request.method === "GET") {
    const { results } = await env.DB.prepare(
      `SELECT id, type, email, name, message, answers, status, follow_up_on, notes, source, created_at, updated_at
       FROM submissions ORDER BY created_at DESC LIMIT 1000`,
    ).all();
    return Response.json({ submissions: results }, { headers });
  }

  // a lead you add yourself: met in person, a DM, a call. Saved as a contact
  // with source "manual"; the email may be blank, since not every lead has one.
  if (url.pathname === "/admin/api/submissions" && request.method === "POST") {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "invalid_json" }, { status: 400, headers });
    }
    const text = (v: unknown, max: number): string | null | undefined =>
      v === undefined || v === null ? null : typeof v !== "string" || v.trim().length > max ? undefined : v.trim() || null;
    const name = text(body.name, 200);
    const email = text(body.email, 254);
    const message = text(body.message, 10000);
    if (name === undefined) return Response.json({ error: "invalid", field: "name" }, { status: 400, headers });
    if (email === undefined || (email && !EMAIL_RE.test(email))) {
      return Response.json({ error: "invalid", field: "email" }, { status: 400, headers });
    }
    if (message === undefined) return Response.json({ error: "invalid", field: "message" }, { status: 400, headers });
    if (!name && !email) return Response.json({ error: "invalid", field: "name" }, { status: 400, headers });

    const row = await env.DB.prepare(
      `INSERT INTO submissions (id, type, email, name, message, source)
       VALUES (?, 'contact', ?, ?, ?, 'manual')
       RETURNING id, type, email, name, message, answers, status, follow_up_on, notes, source, created_at, updated_at`,
    )
      .bind(crypto.randomUUID(), email ?? "", name, message)
      .first();
    return Response.json({ submission: row }, { status: 201, headers });
  }

  const match = url.pathname.match(/^\/admin\/api\/submissions\/([0-9a-f-]{36})$/);
  if (match && request.method === "PATCH") {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "invalid_json" }, { status: 400, headers });
    }

    const sets: string[] = [];
    const values: (string | null)[] = [];

    if ("status" in body) {
      if (!STATUSES.includes(body.status as (typeof STATUSES)[number])) {
        return Response.json({ error: "invalid", field: "status" }, { status: 400, headers });
      }
      sets.push("status = ?");
      values.push(body.status as string);
    }
    if ("follow_up_on" in body) {
      const d = body.follow_up_on;
      if (d !== null && (typeof d !== "string" || !DATE_RE.test(d))) {
        return Response.json({ error: "invalid", field: "follow_up_on" }, { status: 400, headers });
      }
      sets.push("follow_up_on = ?");
      values.push((d as string | null) || null);
    }
    if ("notes" in body) {
      const n = body.notes;
      if (n !== null && (typeof n !== "string" || n.length > 10000)) {
        return Response.json({ error: "invalid", field: "notes" }, { status: 400, headers });
      }
      sets.push("notes = ?");
      values.push((n as string | null)?.trim() || null);
    }
    if (sets.length === 0) return Response.json({ error: "nothing_to_update" }, { status: 400, headers });

    sets.push("updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')");
    const row = await env.DB.prepare(
      `UPDATE submissions SET ${sets.join(", ")} WHERE id = ? RETURNING id, status, follow_up_on, notes, updated_at`,
    )
      .bind(...values, match[1])
      .first();
    if (!row) return Response.json({ error: "not_found" }, { status: 404, headers });
    return Response.json({ submission: row }, { headers });
  }

  return Response.json({ error: "not_found" }, { status: 404, headers });
}

/** compares digests, so the check takes the same time however close a guess is */
async function authorised(request: Request, password: string): Promise<boolean> {
  const header = request.headers.get("Authorization") ?? "";
  if (!header.startsWith("Basic ")) return false;
  let given = "";
  try {
    const decoded = atob(header.slice(6));
    given = decoded.slice(decoded.indexOf(":") + 1);
  } catch {
    return false;
  }
  const enc = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(given)),
    crypto.subtle.digest("SHA-256", enc.encode(password)),
  ]);
  return crypto.subtle.timingSafeEqual(a, b);
}
