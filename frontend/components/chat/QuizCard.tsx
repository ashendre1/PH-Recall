import Link from "next/link";
import { Card } from "@/components/ui/Card";
import type { QuizCardPayload } from "@/types/chat";

type QuizCardProps = {
  payload: QuizCardPayload;
};

export function QuizCard({ payload }: QuizCardProps) {
  const topicSlug = encodeURIComponent(payload.topic);
  const practiceUrl = `/practice?topic=${topicSlug}`;

  return (
    <Card className="max-w-[90%] border-2 border-zinc-200 dark:border-zinc-700">
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
        Practice Set Ready
      </p>
      <p className="font-semibold text-foreground mb-2">{payload.topic}</p>
      <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3">
        {payload.questionCount} questions · {payload.difficulty} · {payload.typeMix}
      </p>
      <div className="flex flex-wrap gap-2 mb-4">
        {payload.sourceTitles.map((title) => (
          <span
            key={title}
            className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs text-zinc-600 dark:text-zinc-400"
          >
            {title}
          </span>
        ))}
      </div>
      <Link
        href={practiceUrl}
        className="inline-flex items-center text-sm font-medium text-foreground hover:underline"
      >
        Start Practice →
      </Link>
    </Card>
  );
}
