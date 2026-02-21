import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-linear-to-b from-zinc-50/80 to-background dark:from-zinc-950/50 dark:to-background">
      <Navbar />
      <main className="flex-1 flex flex-col justify-center px-4">
        <Hero />
      </main>
      <Footer />
    </div>
  );
}
