"use client";

import { useState, type FormEvent } from "react";
import { PARTS, QUESTIONS, type Question } from "@/content/questionnaire";
import { CONTACT_EMAIL, FORMS_ENDPOINT } from "@/lib/sections";
import { useSent } from "@/lib/use-sent";
import { ArrowCell } from "./ArrowCell";
import pl from "./ProjectList.module.css";
import Scramble from "./Scramble";
import s from "./Form.module.css";

type Status = "idle" | "sending" | "error" | "limited";

const WIPE = { words: ["Ooh", "That’s", "Some", "Good", "Stuff"], short: ["Ooh", "Good", "Stuff"] };

/**
 * The brand questionnaire. One ruled row per question: the question on the
 * left, and on the right the answer, which is the row itself rather than a
 * box inside it. Picks are cells that fill with ink when chosen, as the
 * page you're on does in the menu. Contact is built from the same rows.
 */
export default function Questionnaire() {
  const [status, setStatus] = useState<Status>("idle");
  const [picks, setPicks] = useState<Record<string, string[]>>({});
  const [phase, done, swapped] = useSent(WIPE);
  const sent = phase === "sent";

  function pick(q: Extract<Question, { kind: "pick" }>, option: string) {
    setPicks((all) => {
      const now = all[q.id] ?? [];
      const next = q.many
        ? now.includes(option) ? now.filter((o) => o !== option) : [...now, option]
        : now[0] === option ? [] : [option];
      return { ...all, [q.id]: next };
    });
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending" || phase !== "idle") return;
    const data = new FormData(e.currentTarget);

    // stored under each question's label, in the order asked, blanks left out
    const answers: Record<string, string | string[]> = {};
    for (const q of QUESTIONS) {
      const value = q.kind === "pick" ? picks[q.id] ?? [] : String(data.get(q.id) ?? "").trim();
      if (value.length === 0) continue;
      answers[q.label] = q.kind === "pick" && !q.many ? value[0] : value;
    }

    setStatus("sending");
    try {
      const res = await fetch(FORMS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "questionnaire",
          name: data.get("name"),
          email: data.get("email"),
          answers,
          website: data.get("website"),
          source: "/questionnaire",
        }),
      });
      if (res.ok) done();
      else setStatus(res.status === 429 ? "limited" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form className={s.page} onSubmit={submit} data-phase={phase}>
      <div className={s.intro}>
        <p className={s.lead} role={sent ? "status" : undefined}>
          <Scramble
            from="Tell me about your brand. There are no wrong answers, and you can skip anything."
            to="Got all of it. I’ll read every answer properly, probably twice, and get back to you in a few days."
            play={sent}
            onDone={swapped}
          />
        </p>
      </div>

      <div className={s.body}>
      <div className={s.bodyIn}>

      <label className={s.row}>
        <span className={s.q}>
          <span className={s.ask}>Your name</span>
        </span>
        <input className={s.answer} name="name" autoComplete="name" maxLength={120} placeholder="First and last" />
      </label>
      <label className={s.row}>
        <span className={s.q}>
          <span className={s.ask}>Your email</span>
        </span>
        <input
          className={s.answer}
          name="email"
          type="email"
          autoComplete="email"
          maxLength={254}
          required
          placeholder="So I can write back"
        />
      </label>

      {PARTS.map((part) => (
        <section key={part.title} className={s.part}>
          <h2 className={s.partTitle}>{part.title}</h2>
          {part.questions.map((q) => {
            if (q.kind === "text") {
              const Field = q.long ? "textarea" : "input";
              return (
                <label key={q.id} className={`${s.row} ${q === QUESTIONS.at(-1) ? s.last : ""}`}>
                  <span className={s.q}>
                    <span className={s.ask}>{q.ask}</span>
                  </span>
                  <Field
                    className={`${s.answer} ${q.long ? s.long : ""}`}
                    name={q.id}
                    required={q.required}
                    maxLength={q.long ? 3000 : 300}
                    placeholder={q.prompt}
                  />
                </label>
              );
            }
            const chosen = picks[q.id] ?? [];
            return (
              <div key={q.id} className={s.row} role="group" aria-labelledby={`q-${q.id}`}>
                <span className={s.q} id={`q-${q.id}`}>
                  <span className={s.ask}>{q.ask}</span>
                  {q.many && <span className={s.n}>Pick any</span>}
                </span>
                <span className={s.picks}>
                  {q.options.map((o) => (
                    <button
                      key={o}
                      type="button"
                      className={s.pick}
                      aria-pressed={chosen.includes(o)}
                      onClick={() => pick(q, o)}
                    >
                      {o}
                    </button>
                  ))}
                </span>
              </div>
            );
          })}
        </section>
      ))}

      {/* people never see this; a bot fills it in and is quietly dropped */}
      <input className={s.trap} type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />

      {(status === "error" || status === "limited") && (
        <p className={s.error} role="alert">
          {status === "limited" ? "That’s a lot of sends. " : "That didn’t go through. "}
          Try again in a bit, or write to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
      )}

      <div className={s.foot}>
        <button className={`${pl.enter} ${s.send}`} type="submit" disabled={status === "sending"} data-arrow-host>
            <span className={pl.enterLabel}>{status === "sending" ? "Sending…" : "Send it"}</span>
            <ArrowCell corner="inline" />
          </button>
      </div>
      </div>
      </div>
    </form>
  );
}

