import { Card } from "@/components/ui/Card";

const features = [
  {
    title: "Personal Knowledge Base",
    description:
      "Your saved reading history is indexed and searchable. Everything you've read stays in one place.",
  },
  {
    title: "Context-Grounded Chat",
    description:
      "Ask questions and get answers only from your saved pages. Every response includes source citations.",
  },
  {
    title: "Practice & Scoring Mode",
    description:
      "Generate quizzes on any topic you've read. Practice with active recall and get feedback.",
  },
];

export function Features() {
  return (
    <section
      id="features"
      className="py-20 sm:py-28 px-4 sm:px-6 max-w-6xl mx-auto"
    >
      <h2 className="text-2xl sm:text-3xl font-semibold text-center text-foreground mb-16 sm:mb-20">
        Features
      </h2>
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <Card key={f.title} className="p-7 sm:p-8">
            <h3 className="font-semibold text-foreground mb-3 text-lg">
              {f.title}
            </h3>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {f.description}
            </p>
          </Card>
        ))}
      </div>
    </section>
  );
}
