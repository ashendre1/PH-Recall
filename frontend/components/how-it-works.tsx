import { Card, CardContent } from "@/components/ui/card"
import { FileSearch, ShieldAlert, TrendingDown } from "lucide-react"

const steps = [
  {
    icon: FileSearch,
    step: "01",
    title: "Extract clauses",
    description:
      "Our engine parses your document and identifies key contractual clauses, fees, and obligations buried in the fine print.",
  },
  {
    icon: ShieldAlert,
    step: "02",
    title: "Compare against risky patterns",
    description:
      "Each clause is cross-referenced against a database of known predatory patterns, hidden fees, and unfavorable terms.",
  },
  {
    icon: TrendingDown,
    step: "03",
    title: "Score risk & simulate worst-case cost",
    description:
      "Get a clear risk score and see projected worst-case financial impact over the life of the agreement.",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-border/40 bg-muted/25 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-16 text-center">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-widest text-[#8a6b6b]">
            How it works
          </span>
          <h2 className="text-balance font-serif text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Three steps to clarity
          </h2>
          <span className="mx-auto mt-3 block max-w-md text-sm text-[#8a6b6b]">
            Understand your agreement before you commit.
          </span>
        </div>

        <div className="relative grid gap-8 md:grid-cols-3">
          <div
            className="absolute left-1/2 top-14 hidden h-0.5 w-[calc(100%-8rem)] -translate-x-1/2 md:block"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, var(--border) 20%, var(--border) 80%, transparent 100%)",
            }}
            aria-hidden
          />
          {steps.map((step) => {
            const Icon = step.icon
            return (
              <Card
                key={step.step}
                className="relative border-border/50 bg-card shadow-md ring-1 ring-border/30 transition-all hover:shadow-xl hover:shadow-black/20 hover:ring-primary/10"
              >
                <CardContent className="flex flex-col gap-4 pt-6">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                      <Icon className="size-5 text-primary" />
                    </div>
                    <span className="text-xs font-bold tracking-wider text-[#8a6b6b]">
                      STEP {step.step}
                    </span>
                  </div>
                  <h3 className="font-serif text-lg font-semibold tracking-tight text-foreground">
                    {step.title}
                  </h3>
                  <span className="block text-sm leading-relaxed text-[#8a6b6b]">
                    {step.description}
                  </span>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
