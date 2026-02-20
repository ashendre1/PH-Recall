import { Navbar } from "@/components/navbar"
import { Hero } from "@/components/hero"
import { UploadCard } from "@/components/upload-card"
import { HowItWorks } from "@/components/how-it-works"

export default function Home() {
  return (
    <div className="min-h-screen bg-indigo-200">
      <div
        className="fixed inset-0 -z-10 pointer-events-none opacity-[0.4]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0,0,0,0.06) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,0,0,0.06) 1px, transparent 1px)
          `,
          backgroundSize: "28px 28px",
        }}
        aria-hidden
      />
      <div
        className="fixed inset-0 -z-10 pointer-events-none bg-linear-to-b from-muted/50 from-0% via-muted/15 via-30% to-transparent to-70%"
        aria-hidden
      />
      <Navbar />
      <main>
        <Hero />
        <UploadCard />
        <HowItWorks />
      </main>
      
      <footer className="border-t border-border/40 bg-card/50 py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center gap-6 text-center">
            <span className="block text-sm font-medium text-foreground">SmartSign</span>
            <span className="block max-w-xl text-xs leading-relaxed text-[#8a6b6b]">
              SmartSign is for informational purposes only and does not constitute
              legal or financial advice.
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
