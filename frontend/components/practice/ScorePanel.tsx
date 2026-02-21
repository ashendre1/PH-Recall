import Link from "next/link";
import { Card } from "@/components/ui/Card";

type ScorePanelProps = {
  score: number;
  total: number;
  overallFeedback: string;
  whatToReview: string[];
  onRegenerate: () => void;
  onTryAgain: () => void;
};

export function ScorePanel({
  score,
  total,
  overallFeedback,
  whatToReview,
  onRegenerate,
  onTryAgain,
}: ScorePanelProps) {
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card className="text-center py-8">
        <p className="text-4xl font-bold text-foreground">
          {score} / {total}
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Score
        </p>
      </Card>
      <Card>
        <h3 className="font-semibold text-foreground mb-2">Overall feedback</h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {overallFeedback}
        </p>
      </Card>
      {whatToReview.length > 0 && (
        <Card>
          <h3 className="font-semibold text-foreground mb-2">What to review</h3>
          <ul className="list-disc list-inside text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
            {whatToReview.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </Card>
      )}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/chat"
          className="rounded-full bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:opacity-90"
        >
          Discuss mistakes in Chat
        </Link>
        <button
          type="button"
          onClick={onRegenerate}
          className="rounded-full border border-black/10 dark:border-white/15 px-5 py-2.5 text-sm font-medium hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
        >
          Regenerate harder
        </button>
        <button
          type="button"
          onClick={onTryAgain}
          className="rounded-full border border-black/10 dark:border-white/15 px-5 py-2.5 text-sm font-medium hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
