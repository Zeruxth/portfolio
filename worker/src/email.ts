/**
 * The notification email, built only from the Design System page: ground and
 * ink, the sheet's text styles, 1px rules, 16 padding, and the contact row
 * with its arrow box for the two actions. Tables and inline styles, because
 * that's all mail clients reliably keep; webfonts mostly don't load, so the
 * stacks fall back the way the site's do.
 */

export interface MailLead {
  id: string;
  type: "contact" | "questionnaire";
  email: string;
  name: string | null;
  message: string | null;
  answers: Record<string, unknown> | null;
  source: string | null;
}

const BG = "#DEDEDE";
const INK = "#222222";
const RULE = `1px solid ${INK}`;
const UI = `'trade-gothic-next-condensed','Trade Gothic Next LT Pro Condensed','Roboto Condensed','Arial Narrow',sans-serif`;
// Arial before the generic monospace: mail can't load Under, and Arial's Hebrew reads far better than a monospaced one
const MONO = `'IBM Plex Mono',ui-monospace,Menlo,Consolas,Arial,monospace`;
// an email is the heads-up, the dashboard is where it's read: long answers are cut here
const CUT = 220;

// the sheet's text styles
const UI_CASE = `font-family:${UI};font-size:30px;line-height:38px;text-transform:uppercase;color:${INK};`;
const UI_MENU = `font-family:${UI};font-size:22px;line-height:28px;text-transform:uppercase;color:${INK};`;
const MONO_BODY = `font-family:${MONO};font-size:18px;line-height:1.3;letter-spacing:0.18px;color:${INK};`;
const MONO_META = `font-family:${MONO};font-size:16px;line-height:1.3;letter-spacing:0.16px;text-transform:uppercase;color:${INK};`;
const MONO_LABEL = `font-family:${MONO};font-size:14px;line-height:1.3;letter-spacing:0.14px;text-transform:uppercase;color:${INK};`;

export function renderLeadEmail(lead: MailLead, origin: string) {
  const kind = lead.type === "contact" ? "New message" : "New questionnaire";
  const who = lead.name ?? lead.email;
  const when = new Date().toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jerusalem",
  });
  const answers = lead.answers ? Object.entries(lead.answers) : [];
  const replySubject = encodeURIComponent(
    lead.type === "contact" ? "Re: your message" : "Re: your brand questionnaire",
  );
  const dashboard = `${origin}/admin`;
  const arrow = `${origin}/email/arrow.png`;

  const block = (inner: string) => `<tr><td style="padding:16px;border-bottom:${RULE};">${inner}</td></tr>`;
  const label = (text: string) => `<div style="${MONO_LABEL}margin:0 0 8px;">${esc(text)}</div>`;

  // the contact row: UI/Menu, the arrow docked bottom right in its 40px box
  const row = (href: string, text: string, last: boolean) => `<tr><td style="padding:0;${last ? "" : `border-bottom:${RULE};`}">
    <a href="${href}" style="display:block;text-decoration:none;color:${INK};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td valign="top" style="padding:16px;${UI_MENU}">${esc(text)}</td>
        <td width="40" valign="bottom" style="width:40px;padding:0;">
          <table role="presentation" width="40" cellpadding="0" cellspacing="0" border="0" style="border-top:${RULE};border-left:${RULE};"><tr>
            <td width="39" height="39" align="center" valign="middle" style="width:39px;height:39px;padding:0;"><img src="${arrow}" width="22" height="16" alt="" style="display:block;border:0;"></td>
          </tr></table>
        </td>
      </tr></table>
    </a>
  </td></tr>`;

  const message = lead.message
    ? block(`${label("Message")}<div dir="auto" style="${MONO_BODY}white-space:pre-wrap;">${esc(cut(lead.message, CUT * 4))}</div>`)
    : "";

  // each answer is its own ruled block, the question above it, at the full width of the mail
  const filled = answers.filter(([, v]) => show(v).trim());
  const cutAny = filled.some(([, v]) => show(v).length > CUT);
  const answerBlock = filled
    .map(([k, v]) => block(`${label(k.replace(/[_-]/g, " "))}<div dir="auto" style="${MONO_BODY}">${esc(cut(show(v), CUT))}</div>`))
    .join("") +
    (cutAny ? block(`<div style="${MONO_LABEL}">Long answers are cut short here. All ${filled.length}, in full, under Open leads</div>`) : "");

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono&family=Roboto+Condensed&display=swap">
<title>${esc(kind)}</title></head>
<body style="margin:0;padding:0;background:${BG};">
<div style="display:none;max-height:0;overflow:hidden;">${esc(preview(lead))}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BG};">
<tr><td align="center" style="padding:24px 16px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;border:${RULE};background:${BG};text-align:left;">
    ${block(`<div style="${MONO_LABEL}">${esc(kind)}</div>`)}
    ${block(`<div style="${UI_CASE}word-break:break-word;">${esc(who)}</div>
      <div style="${MONO_META}margin-top:8px;">${lead.name ? `${esc(lead.email)} / ` : ""}${esc(when)}</div>`)}
    ${message}
    ${answerBlock}
    ${row(`mailto:${encodeURIComponent(lead.email)}?subject=${replySubject}`, "Reply", false)}
    ${row(dashboard, "Open leads", true)}
  </table>
</td></tr>
</table>
</body></html>`;

  const text = [
    `${kind} from ${lead.name ? `${lead.name} <${lead.email}>` : lead.email}`,
    when,
    "",
    lead.message ?? "",
    ...answers.map(([k, v]) => `${k.replace(/[_-]/g, " ")}: ${show(v)}`),
    "",
    "Reply: answer this email",
    `Leads: ${dashboard}`,
  ]
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { subject: `${kind} — ${who}`, html, text };
}

function preview(lead: MailLead): string {
  const src = lead.message ?? (lead.answers ? Object.values(lead.answers).map(show).join(" / ") : "");
  return src.slice(0, 140);
}

function cut(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  const head = t.slice(0, max);
  return `${head.slice(0, Math.max(head.lastIndexOf(" "), max - 20)).trimEnd()}…`;
}

function show(v: unknown): string {
  if (Array.isArray(v)) return v.map(show).join(", ");
  if (v && typeof v === "object") return JSON.stringify(v);
  return String(v ?? "");
}

function esc(value: string): string {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
