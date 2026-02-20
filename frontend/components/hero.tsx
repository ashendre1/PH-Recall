import { Button } from "@/components/ui/button"
import { Lock, ArrowDown } from "lucide-react"

export function Hero() {
  return (
    <section className="relative mx-auto max-w-6xl px-6 pb-16 pt-16 md:pb-24 md:pt-24">
      <div
        className="pointer-events-none absolute -top-24 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full opacity-40 blur-[100px]"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, oklch(0.55 0.12 260 / 0.35), transparent 70%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute top-1/3 right-0 h-64 w-96 rounded-full opacity-30 blur-[80px]"
        style={{
          background:
            "radial-gradient(ellipse 50% 50%, oklch(0.65 0.08 220 / 0.25), transparent 70%)",
        }}
        aria-hidden
      />

      <div className="relative flex flex-col items-center text-center">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/80 px-4 py-1.5 text-xs font-medium tracking-wide text-[#8a6b6b] shadow-sm backdrop-blur-sm">
          <Lock className="size-3.5 text-primary" aria-hidden />
          <span>Read before you sign</span>
        </div>
        <h1 className="max-w-3xl text-balance font-serif text-4xl font-bold leading-[1.15] tracking-tight text-foreground md:text-5xl lg:text-6xl">
          Decode debt documents.
          <br />
          <span className="text-neutral-500">See what can cost you later.</span>
        </h1>
        <span className="mt-6 block max-w-xl text-pretty text-base leading-relaxed text-[#8a6b6b] md:text-lg">
          Upload any financial agreement and let SmartSign extract risky clauses,
          score hidden costs, and simulate worst-case scenarios — before you sign.
        </span>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <Button size="lg" className="min-w-[168px] rounded-lg font-medium shadow-md shadow-primary/20" asChild>
            <a href="#upload">Upload a PDF</a>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="min-w-[168px] rounded-lg font-medium border-border bg-card/50"
            asChild
          >
            <a href="#how-it-works" className="inline-flex items-center gap-2">
              How it works
              <ArrowDown className="size-4 opacity-70" aria-hidden />
            </a>
          </Button>
        </div>
      </div>
    </section>
  )
}
