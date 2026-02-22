import type { InlineQuizQuestion } from "@/types/chat";
import type { QuizQuestion, QuizGenerateResponse, QuizScoreResponse, AudioQuizScoreResponse } from "@/types/quiz";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Backend API types
interface BackendQuizQuestion {
  question: string;
  questionType: string;
  options: string[];
  correctAnswer: number;
  paragraphIds: string[];
}

interface BackendQuizGenerateResponse {
  questions: BackendQuizQuestion[];
  topic: string;
  paragraphsUsed: Array<{
    text: string;
    paragraphId: string;
    similarity: number;
  }>;
}

interface BackendQuizAnswerItem {
  questionId: string;
  question: string;
  options: string[];
  correctAnswer: number;
  selectedAnswer: number;
}

interface BackendQuizScoreRequest {
  answers: BackendQuizAnswerItem[];
}

interface BackendQuizScoreResult {
  questionId: string;
  score: number;
  feedback: string;
}

interface BackendQuizScoreResponse {
  results: BackendQuizScoreResult[];
  totalScore: number;
  totalQuestions: number;
}

/**
 * Generate quiz questions from the backend
 */
export async function generateQuiz(
  topic: string,
  quizType: "text" | "audio" = "text",
  numQuestions: number = 5
): Promise<QuizGenerateResponse> {
  try {
    const response = await fetch(`${API_URL}/quiz/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topic,
        quizType,
        numQuestions,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Failed to generate quiz" }));
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    const data: BackendQuizGenerateResponse = await response.json();

    // Transform backend format to frontend format
    const questions: QuizQuestion[] = data.questions.map((q, index) => ({
      id: `q-${index + 1}`,
      question: q.question,
      questionType: q.questionType as "mcq" | "true_false" | "elaborate",
      options: q.options,
      correctAnswer: q.correctAnswer,
      paragraphIds: q.paragraphIds,
    }));

    // Extract sources from paragraphsUsed
    const sources = data.paragraphsUsed.map((para, index) => ({
      id: para.paragraphId || `source-${index}`,
      title: `Source ${index + 1}`,
      url: undefined, // Backend doesn't return URL in paragraphsUsed currently
    }));

    return {
      questions,
      topic: data.topic,
      sources,
    };
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw error;
  }
}

/**
 * Score quiz answers (for text quiz with MCQ and True/False)
 */
export async function scoreQuiz(
  answers: Record<string, number>,
  questions: QuizQuestion[]
): Promise<QuizScoreResponse> {
  try {
    // Transform frontend format to backend format
    const answerItems: BackendQuizAnswerItem[] = questions.map((q) => ({
      questionId: q.id,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      selectedAnswer: answers[q.id] ?? -1,
    }));

    const response = await fetch(`${API_URL}/quiz/score`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        answers: answerItems,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Failed to score quiz" }));
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    const data: BackendQuizScoreResponse = await response.json();

    return {
      results: data.results,
      totalScore: data.totalScore,
      totalQuestions: data.totalQuestions,
    };
  } catch (error) {
    console.error("Error scoring quiz:", error);
    throw error;
  }
}

/**
 * Score audio quiz answer using Eleven Labs STT and Gemini evaluation
 */
export async function scoreAudioQuiz(
  audioBlob: Blob,
  question: string,
  topic: string,
  paragraphIds: string[] = []
): Promise<AudioQuizScoreResponse> {
  try {
    const formData = new FormData();
    formData.append("audio", audioBlob, "audio.webm"); // or appropriate format
    formData.append("question", question);
    formData.append("topic", topic);
    formData.append("paragraphIds", JSON.stringify(paragraphIds));

    const response = await fetch(`${API_URL}/quiz/score-audio`, {
      method: "POST",
      body: formData, // Don't set Content-Type header - browser will set it with boundary
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Failed to score audio quiz" }));
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    const data: AudioQuizScoreResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Error scoring audio quiz:", error);
    throw error;
  }
}
