import { Instagram, LinkedIn, Mail, Phone, Spotify } from "@/components/icons";
import { pageMeta } from "@/lib/meta";
import { BY_KEY, CONTACT_EMAIL } from "@/lib/sections";
import s from "./page.module.css";

export const metadata = pageMeta("About", BY_KEY.about.explainer!, "/about/");

// files live under /public, which Pages serves below the base path
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const ROLES = [
  {
    name: "Studio&more",
    meta: ["2025 - Present", "Visual Designer"],
    text: "Joined as an intern before becoming a full-time designer, working alongside the team on brand identities, websites, campaigns, and motion projects for a variety of clients.",
  },
  {
    name: "Wizo",
    note: "(University of Haifa)",
    meta: ["2022 - 2026", "B.Des. Visual Communication"],
    text: "Four years of exploring different disciplines, experimenting with ideas, and pushing creative boundaries through projects that helped me develop my own approach to design.",
  },
  {
    name: "Freelance",
    meta: ["2020 - Present"],
    text: "My interest in design started back in 2013 and gradually led to freelance projects, giving me the opportunity to work directly with clients and manage projects independently.",
  },
];

const ELSEWHERE = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/aki-yamin-8a8333357/", Icon: LinkedIn },
  { label: "Instagram", href: "https://www.instagram.com/aki_wip/", Icon: Instagram },
  { label: "Spotify", href: "https://open.spotify.com/user/11186282724", Icon: Spotify },
  { label: "Phone", href: "tel:+972524477235", Icon: Phone },
  { label: "Email", href: `mailto:${CONTACT_EMAIL}`, Icon: Mail },
];

export default function About() {
  return (
    <div className={s.page}>
      <h1 className="sr-only">About</h1>

      <div className={s.top}>
        <figure className={s.me}>
          <img
            className={s.photo}
            src={`${BASE}/about/me.jpg`}
            alt="Aki at 13, in green headphones, working on a laptop at a desk"
          />
          <figcaption className={s.caption}>/ me, 13 years old on cinema4d</figcaption>
        </figure>
        <div className={s.introCell}>
          <p className={s.intro}>
            I’m Aki Yamin, a multidisciplinary designer based in Tel Aviv. I have a habit of getting
            a little too into things. Whether it’s design, video games, planning my next trip, or
            making the perfect cocktail, I like exploring ideas, trying new things, figuring things
            out, and getting the little details just right.
          </p>
          <div className={s.elsewhere}>
            <span className={s.alsoOn}>Also on</span>
            {ELSEWHERE.map(({ label, href, Icon }) => (
              <a
                key={label}
                className={s.social}
                href={href}
                aria-label={label}
                // the portfolio stays where you left it, as it does for every outbound link
                {...(href.startsWith("http") && { target: "_blank", rel: "noopener noreferrer" })}
              >
                <Icon />
              </a>
            ))}
          </div>
        </div>
      </div>

      {ROLES.map((role) => (
        <section className={s.role} key={role.name}>
          <h2 className={s.name}>
            {role.name}
            {role.note && <small className={s.note}> {role.note}</small>}
          </h2>
          <ul className={s.meta}>
            {role.meta.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <p className={s.text}>{role.text}</p>
        </section>
      ))}
    </div>
  );
}
