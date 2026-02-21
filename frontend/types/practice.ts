export type PracticeQuestion = {
  id: string;
  text: string;
  hint?: string;
  sourceTitle?: string;
  userAnswer: string;
  /** Set after grading */
  score?: number;
  feedback?: string;
};

export type GradedResult = {
  totalScore: number;
  totalQuestions: number;
  perQuestion: { questionId: string; score: number; feedback: string }[];
  overallFeedback: string;
  whatToReview: string[];
};
