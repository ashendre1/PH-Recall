"use client";

import { useState, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { InlineQuizPayload, InlineQuizQuestion } from "@/types/chat";

type InlineQuizProps = {
  payload: InlineQuizPayload;
  messageId: string;
  onSubmit: (messageId: string, answers: Record<string, number>) => void;
};

export function InlineQuiz({ payload, messageId, onSubmit }: InlineQuizProps) {
  const { questions, submittedAnswers, score, feedback } = payload;
  const evaluated = submittedAnswers !== undefined && score !== undefined;

  const [localAnswers, setLocalAnswers] = useState<Record<string, number>>({});

  const handleOption = useCallback((questionId: string, optionIndex: number) => {
    setLocalAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  }, []);

  const handleSubmit = useCallback(() => {
    const complete = questions.every((q) => localAnswers[q.id] !== undefined);
    if (complete) onSubmit(messageId, localAnswers);
  }, [messageId, localAnswers, questions, onSubmit]);

  const allAnswered = questions.every((q) => localAnswers[q.id] !== undefined);

  return (
    <Card className="max-w-[90%] border-2 border-zinc-200 dark:border-zinc-700 p-4">
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-3">
        Quick Quiz
      </p>
      <div className="flex flex-col gap-4">
        {questions.map((q) => {
          const options = Array.isArray(q.options) ? q.options : [];
          const selectedIndex =
            submittedAnswers != null && typeof submittedAnswers[q.id] === "number"
              ? submittedAnswers[q.id]
              : -1;
          const answerText = options[selectedIndex] ?? "—";
          const correctText = options[q.correctAnswer] ?? "—";

          return (
            <div key={q.id} className="flex flex-col gap-2">
              <p className="text-sm font-medium text-foreground">{q.text}</p>
              {!evaluated ? (
                options.length > 0 ? (
                  <div className="flex flex-col gap-1.5">
                    {options.map((option, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleOption(q.id, idx)}
                        className={`rounded-lg px-3 py-2 text-sm text-left font-medium transition-colors border ${
                          localAnswers[q.id] === idx
                            ? "bg-foreground text-background border-foreground"
                            : "bg-transparent border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500">No options available.</p>
                )
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-sm">
                    Your answer:{" "}
                    <span className="font-medium">{answerText}</span>
                    {selectedIndex === q.correctAnswer ? (
                      <span className="text-green-600 dark:text-green-400 ml-2">
                        ✓ Correct
                      </span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400 ml-2">
                        ✗ Incorrect (correct: {correctText})
                      </span>
                    )}
                  </p>
                  {feedback && feedback[q.id] && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 italic pl-2 border-l-2 border-zinc-300 dark:border-zinc-600">
                      {feedback[q.id]}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {!evaluated ? (
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!allAnswered}
          className="mt-4"
        >
          Submit answers
        </Button>
      ) : (
        <p className="mt-4 text-sm font-medium text-foreground">
          Score: {score}/{questions.length}
        </p>
      )}
    </Card>
  );
}
