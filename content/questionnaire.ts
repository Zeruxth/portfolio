/**
 * The brand questionnaire, in the order it is asked, in four parts. Each
 * answer is stored under its `label`, which is what the leads dashboard shows
 * above it; `prompt` is the greyed-out hint in the empty answer.
 */

export type Question =
  | {
      kind: "text";
      id: string;
      label: string;
      ask: string;
      prompt: string;
      long?: boolean;
      required?: boolean;
    }
  | { kind: "pick"; id: string; label: string; ask: string; options: string[]; many?: boolean };

export interface Part {
  title: string;
  questions: Question[];
}

export const PARTS: Part[] = [
  {
    title: "The brand",
    questions: [
      { kind: "text", id: "brand", label: "Brand", ask: "What’s the brand or project called?", prompt: "Something better than Untitled-final-v2", required: true },
      { kind: "text", id: "what", label: "What you do", ask: "What do you do?", prompt: "What you make or offer, and how", long: true, required: true },
      { kind: "text", id: "story", label: "How it started", ask: "How did it start?", prompt: "Who, when, and why", long: true },
      { kind: "text", id: "why_now", label: "Why now", ask: "Why now?", prompt: "What’s changing, or what isn’t working anymore", long: true },
    ],
  },
  {
    title: "The people",
    questions: [
      { kind: "text", id: "who", label: "Who it’s for", ask: "Who is it for?", prompt: "Who they are, what they care about", long: true },
      { kind: "text", id: "others", label: "Who else does this", ask: "Who else does what you do?", prompt: "Competitors, and what makes you different", long: true },
      { kind: "text", id: "feel", label: "How it should feel", ask: "How should it feel?", prompt: "Three words are enough" },
    ],
  },
  {
    title: "The look",
    questions: [
      { kind: "text", id: "admire", label: "Brands you admire", ask: "Which brands do you admire?", prompt: "Any field. Names or links, and what you like", long: true },
      { kind: "text", id: "avoid", label: "What to avoid", ask: "What should it never look like?", prompt: "Colours, styles, clichés", long: true },
      { kind: "text", id: "today", label: "What exists today", ask: "What exists today?", prompt: "A logo, a site, nothing yet" },
    ],
  },
  {
    title: "The project",
    questions: [
      {
        kind: "pick",
        id: "need",
        label: "What you need",
        ask: "What do you need?",
        many: true,
        options: ["Identity", "Packaging", "Website", "Print", "Motion", "Signage", "Not sure yet"],
      },
      {
        kind: "pick",
        id: "where",
        label: "Where people meet it",
        ask: "Where will people meet it?",
        many: true,
        options: ["Online", "Social media", "Packaging", "In a space", "Print", "Events"],
      },
      { kind: "text", id: "success", label: "What success looks like", ask: "What would success look like?", prompt: "A year from now, what has changed", long: true },
      {
        kind: "pick",
        id: "budget",
        label: "Budget",
        ask: "What’s the budget?",
        options: ["Under ₪10k", "₪10–25k", "₪25–50k", "₪50k+", "Not sure yet"],
      },
      {
        kind: "pick",
        id: "when",
        label: "Timeline",
        ask: "When does it need to be ready?",
        options: ["As soon as possible", "1–3 months", "3–6 months", "No rush"],
      },
      { kind: "text", id: "decides", label: "Who decides", ask: "Who makes the decisions?", prompt: "Just you, partners, a board" },
      {
        kind: "pick",
        id: "found",
        label: "How they found me",
        ask: "How did you find me?",
        options: ["Instagram", "A friend", "Google", "Saw my work somewhere", "Other"],
      },
      { kind: "text", id: "more", label: "Anything else", ask: "Anything else?", prompt: "References, links, worries", long: true },
    ],
  },
];

/** every question in order, for building the answers */
export const QUESTIONS: Question[] = PARTS.flatMap((p) => p.questions);
