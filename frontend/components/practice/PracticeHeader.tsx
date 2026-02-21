import Link from "next/link";

type PracticeHeaderProps = {
  topic: string;
  onRegenerate?: () => void;
};

export function PracticeHeader({ topic, onRegenerate }: PracticeHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-black/[0.06] dark:border-white/10 bg-background/95 backdrop-blur">
      <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <Link
          href="/chat"
          className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-foreground"
        >
          ← Back to Chat
        </Link>
        <span className="inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 text-sm font-medium text-foreground">
          {topic}
        </span>
        <button
          type="button"
          onClick={onRegenerate}
          className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-foreground"
        >
          Regenerate
        </button>
      </div>
    </header>
  );
}
