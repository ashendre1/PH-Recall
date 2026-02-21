"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import type { PracticeQuestion } from "@/types/practice";

type QuestionCardProps = {
  question: PracticeQuestion;
  index: number;
  showGraded: boolean;
  onAnswerChange: (questionId: string, value: string) => void;
};

export function QuestionCard({
  question,
  index,
  showGraded,
  onAnswerChange,
}: QuestionCardProps) {
  const [hintOpen, setHintOpen] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);

  return (
    <Card>
      <div className="flex gap-3">
        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 shrink-0">
          {index + 1}.
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground mb-3">
            {question.text}
          </p>
          {!showGraded ? (
            <>
              <textarea
                value={question.userAnswer}
                onChange={(e) => onAnswerChange(question.id, e.target.value)}
                placeholder="Your answer..."
                rows={3}
                className="w-full rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-zinc-900 px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-foreground/20"
              />
              {question.hint && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => setHintOpen((o) => !o)}
                    className="text-xs font-medium text-zinc-500 hover:text-foreground"
                  >
                    {hintOpen ? "Hide hint" : "Show hint"}
                  </button>
                  {hintOpen && (
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                      {question.hint}
                    </p>
                  )}
                </div>
              )}
              {question.sourceTitle && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => setSourceOpen((o) => !o)}
                    className="text-xs font-medium text-zinc-500 hover:text-foreground"
                  >
                    {sourceOpen ? "Hide source" : "View source"}
                  </button>
                  {sourceOpen && (
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                      {question.sourceTitle}
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-zinc-500">Your answer:</p>
              <p className="text-sm text-foreground bg-zinc-50 dark:bg-zinc-800/50 rounded-lg px-3 py-2">
                {question.userAnswer || "(No answer)"}
              </p>
              {question.feedback != null && (
                <>
                  <p className="text-xs text-zinc-500">
                    Score: {question.score ?? 0}/1
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {question.feedback}
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
