"use client";

import { useState, type FormEvent } from "react";
import { CONTACT_EMAIL, FORMS_ENDPOINT } from "@/lib/sections";
import { useSent } from "@/lib/use-sent";
import { ArrowCell } from "./ArrowCell";
import pl from "./ProjectList.module.css";
import Scramble from "./Scramble";
import s from "./Form.module.css";

type Status = "idle" | "sending" | "error" | "limited";

const WIPE = { words: ["Hell", "Yeah", "It’s", "In", "There"], short: ["Hell", "Yeah", "Sent"] };

/**
 * Email and a message, posted to the forms Worker, which keeps it and mails it
 * on. Built from the same rows as the questionnaire, so the two look alike.
 */
export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [phase, done, swapped] = useSent(WIPE);
  const sent = phase === "sent";

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending" || phase !== "idle") return;
    const data = new FormData(e.currentTarget);
    setStatus("sending");
    try {
      const res = await fetch(FORMS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "contact",
          email: data.get("email"),
          message: data.get("message"),
          website: data.get("website"),
          source: "/contact",
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
            from="Have a project, a job or some cool shit in mind? Tell me about it."
            to="Landed. It’s in my inbox now, and I’ll get back to you soon. Probably sooner."
            play={sent}
            onDone={swapped}
          />
        </p>
        {phase === "idle" && (
          <p className={s.aside}>
            Or write to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </p>
        )}
      </div>

      <div className={s.body}>
        <div className={`${s.bodyIn} ${s.twoRows}`}>
          <label className={s.row}>
            <span className={s.q}>
              <span className={s.ask}>Your email</span>
            </span>
            <input
              className={s.answer}
              type="email"
              name="email"
              required
              maxLength={254}
              autoComplete="email"
              placeholder="So I can write back"
            />
          </label>

          <label className={`${s.row} ${s.fill} ${s.last}`}>
            <span className={s.q}>
              <span className={s.ask}>What’s on your mind?</span>
            </span>
            <textarea
              className={`${s.answer} ${s.long}`}
              name="message"
              required
              maxLength={5000}
              placeholder="A project, a job, some cool shit. Spill."
            />
          </label>

          {/* people never see this; a bot fills it in and is quietly dropped */}
          <input className={s.trap} type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />

          {(status === "error" || status === "limited") && (
            <p className={s.error} role="alert">
              {status === "limited" ? "That’s a lot of messages. " : "That didn’t go through. "}
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
