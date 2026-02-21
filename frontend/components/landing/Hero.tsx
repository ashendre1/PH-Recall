import { Button } from "@/components/ui/Button";

export function Hero() {
  return (
    <section className="text-center max-w-3xl mx-auto py-12 sm:py-16 md:py-20">
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-foreground leading-tight">
        Turn what you read into what you remember.
      </h1>
      <p className="mt-8 sm:mt-10 text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl mx-auto">
        Recall what you've learned. Ask questions and get answers from what
        you've read. Quiz yourself when you want to remember more.
      </p>
      <div className="mt-12 sm:mt-14">
        <Button href="/chat" variant="primary" className="px-6 py-3 text-base">
          Give it a try
        </Button>
      </div>
    </section>
  );
}
