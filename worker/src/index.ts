/**
 * POST /submit takes a form from the site, stores it in D1 and emails Aki.
 *
 * The row is written first and the email goes out afterwards, so a lead is
 * never lost to a failed send: the dashboard still has it.
 */
import { handleAdmin } from "./admin";
import { renderLeadEmail } from "./email";
import { arrowPng } from "./assets";

const TYPES = ["contact", "questionnaire"] as const;
type FormType = (typeof TYPES)[number];

const LIMITS = { email: 254, name: 120, message: 5000, answers: 20000, source: 200 };
// a person sends a handful at most; more than this from one address is a script
const MAX_PER_WINDOW = 5;
const WINDOW_MINUTES = 10;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Payload {
  type?: unknown;
  email?: unknown;
  name?: unknown;
  message?: unknown;
  answers?: unknown;
  source?: unknown;
  /** the honeypot: hidden from people, so anything in it came from a bot */
  website?: unknown;
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/admin" || url.pathname.startsWith("/admin/")) {
      return handleAdmin(request, env, url);
    }
    if (url.pathname === "/email/arrow.png") return arrowPng();

    const cors = corsHeaders(request, env);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (url.pathname !== "/submit") return json({ error: "not_found" }, 404, cors);
    if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405, cors);
    // a browser on another site gets no CORS headers back, and so no answer
    if (!cors["Access-Control-Allow-Origin"]) return json({ error: "forbidden" }, 403, cors);

    let body: Payload;
    try {
      body = await request.json();
    } catch {
      return json({ error: "invalid_json" }, 400, cors);
    }

    // a bot filled the hidden field: tell it all went well and keep nothing
    if (typeof body.website === "string" && body.website.trim() !== "") {
      return json({ ok: true }, 200, cors);
    }

    const parsed = parse(body);
    if ("error" in parsed) return json(parsed, 400, cors);

    const ip = request.headers.get("CF-Connecting-IP") ?? "";
    const ipHash = ip ? await sha256(ip) : null;

    if (ipHash) {
      const recent = await env.DB.prepare(
        `SELECT COUNT(*) AS n FROM submissions
         WHERE ip_hash = ?1 AND created_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now', ?2)`,
      )
        .bind(ipHash, `-${WINDOW_MINUTES} minutes`)
        .first<{ n: number }>();
      if (recent && recent.n >= MAX_PER_WINDOW) return json({ error: "rate_limited" }, 429, cors);
    }

    const id = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO submissions (id, type, email, name, message, answers, source, ip_hash, user_agent)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`,
    )
      .bind(
        id,
        parsed.type,
        parsed.email,
        parsed.name,
        parsed.message,
        parsed.answers,
        parsed.source,
        ipHash,
        request.headers.get("User-Agent")?.slice(0, 300) ?? null,
      )
      .run();

    // always the live origin: the email is read in an inbox, not on this machine
    ctx.waitUntil(notify(env, id, parsed, "https://api.akiwip.work"));

    return json({ ok: true, id }, 201, cors);
  },
} satisfies ExportedHandler<Env>;

interface Submission {
  type: FormType;
  email: string;
  name: string | null;
  message: string | null;
  answers: string | null;
  source: string | null;
}

function parse(body: Payload): Submission | { error: string; field?: string } {
  const type = body.type ?? "contact";
  if (typeof type !== "string" || !TYPES.includes(type as FormType)) {
    return { error: "invalid", field: "type" };
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!email || email.length > LIMITS.email || !EMAIL_RE.test(email)) {
    return { error: "invalid", field: "email" };
  }

  const name = optionalText(body.name, LIMITS.name);
  const message = optionalText(body.message, LIMITS.message);
  const source = optionalText(body.source, LIMITS.source);
  if (name === undefined) return { error: "invalid", field: "name" };
  if (message === undefined) return { error: "invalid", field: "message" };
  if (source === undefined) return { error: "invalid", field: "source" };

  let answers: string | null = null;
  if (body.answers !== undefined && body.answers !== null) {
    if (typeof body.answers !== "object") return { error: "invalid", field: "answers" };
    answers = JSON.stringify(body.answers);
    if (answers.length > LIMITS.answers) return { error: "invalid", field: "answers" };
  }

  // a contact form is its message; a questionnaire is its answers
  if (type === "contact" && !message) return { error: "invalid", field: "message" };
  if (type === "questionnaire" && !answers) return { error: "invalid", field: "answers" };

  return { type: type as FormType, email, name, message, answers, source };
}

/** null when absent or blank, undefined when it is the wrong shape or too long */
function optionalText(value: unknown, max: number): string | null | undefined {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return undefined;
  const text = value.trim();
  if (text.length > max) return undefined;
  return text || null;
}

async function notify(env: Env, id: string, s: Submission, origin: string): Promise<void> {
  const mail = renderLeadEmail(
    { id, ...s, answers: s.answers ? JSON.parse(s.answers) : null },
    origin,
  );
  try {
    const sent = await env.EMAIL.send({
      to: env.NOTIFY_TO,
      from: { email: env.NOTIFY_FROM, name: "AKI_WIP" },
      replyTo: s.email,
      ...mail,
    });
    console.log("notify sent", id, sent.messageId);
  } catch (err) {
    // the row is already saved, so this only costs the notification
    console.error("notify failed", id, err);
  }
}

function corsHeaders(request: Request, env: Env): Record<string, string> {
  const origin = request.headers.get("Origin") ?? "";
  const allowed = env.ALLOWED_ORIGINS.split(",").map((o) => o.trim());
  const headers: Record<string, string> = { Vary: "Origin" };
  if (allowed.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "POST, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type";
    headers["Access-Control-Max-Age"] = "86400";
  }
  return headers;
}

function json(data: unknown, status: number, headers: Record<string, string>): Response {
  return Response.json(data, { status, headers });
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
