import { QuestionCard } from "./QuestionCard";
import type { PracticeQuestion } from "@/types/practice";

type QuestionListProps = {
  questions: PracticeQuestion[];
  showGraded: boolean;
  onAnswerChange: (questionId: string, value: string) => void;
};

export function QuestionList({
  questions,
  showGraded,
  onAnswerChange,
}: QuestionListProps) {
  return (
    <div className="space-y-4 py-6 px-4 max-w-3xl mx-auto">
      {questions.map((q, i) => (
        <QuestionCard
          key={q.id}
          question={q}
          index={i}
          showGraded={showGraded}
          onAnswerChange={onAnswerChange}
        />
      ))}
    </div>
  );
}
