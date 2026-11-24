import ContactForm from "@/components/ContactForm";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta(
  "Contact",
  "Have a project, a job or some cool shit in mind? Tell me about it.",
  "/contact/",
);

export default function Contact() {
  return (
    <>
      <h1 className="sr-only">Contact</h1>
      <ContactForm />
    </>
  );
}
