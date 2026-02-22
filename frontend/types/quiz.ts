export type QuestionType = "mcq" | "true_false" | "elaborate";

export type QuizQuestion = {
  id: string;
  question: string;
  questionType: QuestionType;
  options: string[];
  correctAnswer: number;
  paragraphIds?: string[];
};

export type QuizGenerateResponse = {
  questions: QuizQuestion[];
  topic: string;
  sources: Array<{
    id: string;
    title: string;
    url?: string;
  }>;
};

export type QuizScoreResult = {
  questionId: string;
  score: number;
  feedback: string;
};

export type QuizScoreResponse = {
  results: QuizScoreResult[];
  totalScore: number;
  totalQuestions: number;
};

export type AudioQuizScoreResponse = {
  score: number; // 0.0 to 1.0 (articulateness score from Gemini)
  transcribedText: string;
  isHesitant: boolean;
  elevenLabsFeedback: string; // Feedback about hesitancy/fluency
  geminiFeedback: string; // Feedback about articulateness
  audioFeedbackUrl?: string;
};
