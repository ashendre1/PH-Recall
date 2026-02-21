import Link from "next/link";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { AppBrand } from "@/components/AppBrand";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-linear-to-b from-zinc-50/80 to-background dark:from-zinc-950/50 dark:to-background">
      <header className="border-b border-black/6 dark:border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <AppBrand size="md" />
          <Link
            href="/"
            className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-foreground"
          >
            ← Home
          </Link>
        </div>
      </header>
      <main className="flex-1 pb-20 sm:pb-28">
        <Features />
        <HowItWorks />
      </main>
    </div>
  );
}
