"use client";

import { useState, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { PracticeHeader } from "@/components/practice/PracticeHeader";
import { QuestionList } from "@/components/practice/QuestionList";
import { ProgressBar } from "@/components/practice/ProgressBar";
import { ScorePanel } from "@/components/practice/ScorePanel";
import type { PracticeQuestion, GradedResult } from "@/types/practice";

const MOCK_QUESTIONS: Omit<PracticeQuestion, "userAnswer">[] = [
  { id: "q1", text: "What is a JWT and what are its main parts?", hint: "Think about header, payload, signature.", sourceTitle: "Auth0 Docs" },
  { id: "q2", text: "How does session-based authentication differ from token-based auth?", sourceTitle: "MDN Web Security" },
  { id: "q3", text: "When would you choose JWT over server-side sessions?", hint: "Consider scale and revocation." },
  { id: "q4", text: "What is the purpose of the JWT signature?", sourceTitle: "Auth0 Docs" },
  { id: "q5", text: "How can you securely store JWTs in the browser?", sourceTitle: "MDN Web Security" },
  { id: "q6", text: "What are the risks of putting sensitive data in the JWT payload?", sourceTitle: "Auth0 Docs" },
  { id: "q7", text: "Explain the difference between access tokens and refresh tokens.", hint: "Think about expiry and storage." },
  { id: "q8", text: "Why might you avoid storing JWTs in localStorage?", sourceTitle: "MDN Web Security" },
  { id: "q9", text: "What is token revocation and how is it typically handled for JWTs?", sourceTitle: "Auth0 Docs" },
  { id: "q10", text: "When is server-side session storage a better choice than JWTs?", sourceTitle: "MDN Web Security" },
];

const MOCK_GRADED: GradedResult = {
  totalScore: 7,
  totalQuestions: 10,
  perQuestion: MOCK_QUESTIONS.map((q, i) => ({
    questionId: q.id,
    score: i < 7 ? 1 : 0,
    feedback:
      i < 7
        ? "Good answer, aligned with the source."
        : "Missing key points from the reading. Review the source and try again.",
  })),
  overallFeedback:
    "Solid understanding of JWT and session auth. Focus on secure storage and revocation for full marks.",
  whatToReview: [
    "JWT storage in the browser (localStorage vs cookies)",
    "Token revocation strategies",
    "When to use server-side sessions vs JWTs",
  ],
};

function initialQuestions(
  topic: string
): PracticeQuestion[] {
  return MOCK_QUESTIONS.map((q) => ({
    ...q,
    userAnswer: "",
  }));
}

export default function PracticePage() {
  const searchParams = useSearchParams();
  const topic = searchParams.get("topic") ?? "JWT & Auth";

  const [questions, setQuestions] = useState<PracticeQuestion[]>(() =>
    initialQuestions(topic)
  );
  const [graded, setGraded] = useState<GradedResult | null>(null);

  const answeredCount = useMemo(
    () => questions.filter((q) => q.userAnswer.trim().length > 0).length,
    [questions]
  );

  const handleAnswerChange = useCallback((questionId: string, value: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, userAnswer: value } : q))
    );
  }, []);

  const handleGrade = useCallback(() => {
    const result = { ...MOCK_GRADED };
    setQuestions((prev) =>
      prev.map((q) => {
        const item = result.perQuestion.find((p) => p.questionId === q.id);
        return {
          ...q,
          score: item?.score,
          feedback: item?.feedback,
        };
      })
    );
    setGraded(result);
  }, []);

  const handleTryAgain = useCallback(() => {
    setQuestions(initialQuestions(topic));
    setGraded(null);
  }, [topic]);

  const showGraded = graded != null;
  const questionsWithScores = showGraded ? questions : questions;

  return (
    <div className="min-h-screen flex flex-col bg-linear-to-b from-zinc-50/50 to-background dark:from-zinc-950/30 dark:to-background">
      <PracticeHeader topic={topic} />
      {showGraded ? (
        <div className="flex-1 overflow-y-auto">
          <ScorePanel
            score={graded.totalScore}
            total={graded.totalQuestions}
            overallFeedback={graded.overallFeedback}
            whatToReview={graded.whatToReview}
            onRegenerate={() => {}}
            onTryAgain={handleTryAgain}
          />
          <div className="border-t border-black/6 dark:border-white/10 pt-6">
            <h2 className="text-lg font-semibold px-4 max-w-3xl mx-auto mb-4">
              Per-question breakdown
            </h2>
            <QuestionList
              questions={questionsWithScores}
              showGraded={true}
              onAnswerChange={() => {}}
            />
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto">
            <QuestionList
              questions={questions}
              showGraded={false}
              onAnswerChange={handleAnswerChange}
            />
          </div>
          <ProgressBar
            answered={answeredCount}
            total={questions.length}
            onGrade={handleGrade}
          />
        </>
      )}
    </div>
  );
}
