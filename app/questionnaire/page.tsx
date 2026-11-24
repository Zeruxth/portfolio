import Questionnaire from "@/components/Questionnaire";
import { pageMeta } from "@/lib/meta";

export const metadata = {
  ...pageMeta("Brand questionnaire", "Tell me about your brand.", "/questionnaire/"),
  // sent to clients as a link, not something to find in search
  robots: { index: false, follow: false },
};

export default function QuestionnairePage() {
  return (
    <>
      <h1 className="sr-only">Brand questionnaire</h1>
      <Questionnaire />
    </>
  );
}
