const steps = [
  {
    step: 1,
    title: "Capture reading",
    description: "Save pages as you browse. Your history becomes your knowledge base.",
  },
  {
    step: 2,
    title: "Retrieve relevant sources",
    description:
      "When you ask a question, we find the most relevant saved content and ground the answer in it.",
  },
  {
    step: 3,
    title: "Generate practice + feedback",
    description:
      "Request quizzes on any topic. Get questions, answer them, and see scores and feedback.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="py-20 sm:py-28 px-4 sm:px-6 max-w-6xl mx-auto"
    >
      <h2 className="text-2xl sm:text-3xl font-semibold text-center text-foreground mb-16 sm:mb-20">
        How it works
      </h2>
      <div className="grid gap-12 sm:gap-16 sm:grid-cols-3 max-w-4xl mx-auto">
        {steps.map((s) => (
          <div key={s.step} className="text-center">
            <div className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-semibold mx-auto mb-6">
              {s.step}
            </div>
            <h3 className="font-semibold text-foreground mb-3 text-lg">
              {s.title}
            </h3>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xs mx-auto">
              {s.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
