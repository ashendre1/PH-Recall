export type Source = {
  id: string;
  title: string;
  url?: string;
};

export type ChatMode = "explain" | "quick-quiz" | "practice-set";

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  /** When set, render inline quiz (questions + submit + score) in the assistant message */
  inlineQuiz?: InlineQuizPayload;
};

export type InlineQuizQuestion = {
  id: string;
  text: string;
  type: "mcq";
  options: string[];
  /** Index of the correct option in `options` */
  correctAnswer: number;
};

export type InlineQuizPayload = {
  questions: InlineQuizQuestion[];
  /** Set after user submits; keys are question ids, values are selected option index (mock: computed on frontend; real: from backend) */
  submittedAnswers?: Record<string, number>;
  score?: number;
  /** Set after scoring; keys are question ids, values are feedback strings from backend */
  feedback?: Record<string, string>;
};

/** Legacy: used by QuizCard (e.g. /practice entry); chat uses inlineQuiz instead */
export type QuizCardPayload = {
  topic: string;
  questionCount: number;
  difficulty: string;
  typeMix: string;
  sourceTitles: string[];
};
