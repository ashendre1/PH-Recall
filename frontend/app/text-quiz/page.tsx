"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { generateQuiz, scoreQuiz } from "@/lib/api";
import type { QuizQuestion, QuizScoreResponse } from "@/types/quiz";

export default function TextQuizPage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scoreResult, setScoreResult] = useState<QuizScoreResponse | null>(null);

  useEffect(() => {
    const storedTopic = sessionStorage.getItem("quizTopic");
    if (storedTopic) {
      setTopic(storedTopic);
      loadQuiz(storedTopic);
    } else {
      router.push("/");
    }
  }, [router]);

  const loadQuiz = async (quizTopic: string) => {
    setIsLoading(true);
    try {
      const result = await generateQuiz(quizTopic, "text", 5);
      setQuestions(result.questions);
    } catch (error) {
      console.error("Error loading quiz:", error);
      alert("Failed to load quiz. Please try again.");
      router.push("/");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (questionId: string, answerIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answerIndex,
    }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length !== questions.length) {
      alert("Please answer all questions before submitting.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await scoreQuiz(answers, questions);
      setScoreResult(result);
    } catch (error) {
      console.error("Error scoring quiz:", error);
      alert("Failed to score quiz. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToHome = () => {
    router.push("/");
  };

  const handleTryAgain = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setScoreResult(null);
    if (topic) {
      loadQuiz(topic);
    }
  };

  if (isLoading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center" 
        style={{ 
          background: "radial-gradient(circle at center, #FFFBF0 0%, #FAF0D0 40%, #F0E4B8 70%, #E0D0A0 100%)",
          minHeight: "100vh"
        }}
      >
        <div className="text-center">
          <p style={{ color: "var(--brown)", fontFamily: "var(--font-lora), serif" }}>Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (scoreResult) {
    const percentage = Math.round((scoreResult.totalScore / scoreResult.totalQuestions) * 100);
    return (
      <div 
        className="min-h-screen" 
        style={{ 
          background: "radial-gradient(circle at center, #FFFBF0 0%, #FAF0D0 40%, #F0E4B8 70%, #E0D0A0 100%)",
          minHeight: "100vh"
        }}
      >
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div
            className="rounded-3xl shadow-xl p-8 md:p-12 text-center"
            style={{ backgroundColor: "#ffffff" }}
          >
            <div className="flex justify-center mb-6">
              <Image
                src="/logo_3.png"
                alt="Recall"
                width={100}
                height={100}
                className="inline-block"
              />
            </div>
            <h1 className="mb-4 text-2xl font-semibold" style={{ color: "var(--brown)", fontFamily: "var(--font-lora), serif" }}>
              Quiz Complete!
            </h1>
            <div className="mb-8">
              <div
                className="text-6xl mb-4 font-bold"
                style={{ color: "var(--carolina-blue)" }}
              >
                {scoreResult.totalScore}/{scoreResult.totalQuestions}
              </div>
              <p className="text-xl" style={{ color: "var(--brown)", fontFamily: "var(--font-lora), serif" }}>
                {percentage === 100
                  ? "Perfect score! Amazing work!"
                  : percentage >= 60
                  ? "Great job! Keep practicing!"
                  : "Good effort! Try again to improve!"}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleTryAgain}
                className="px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 hover:scale-105 font-medium"
                style={{
                  backgroundColor: "var(--carolina-blue)",
                  color: "#ffffff",
                  fontFamily: "var(--font-lora), serif",
                }}
              >
                Try Again
              </button>
              <button
                onClick={handleBackToHome}
                className="px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 hover:scale-105 font-medium"
                style={{
                  backgroundColor: "var(--peach)",
                  color: "#ffffff",
                  fontFamily: "var(--font-lora), serif",
                }}
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const hasAnswer = currentQ && answers[currentQ.id] !== undefined;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--beige)" }}>
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleBackToHome}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:scale-105 font-medium"
            style={{
              backgroundColor: "var(--carolina-blue)",
              color: "#ffffff",
              fontFamily: "var(--font-lora), serif",
            }}
          >
            Home
          </button>
          <div className="flex items-center gap-3">
            <Image
              src="/logo_3.png"
              alt="Recall"
              width={50}
              height={50}
              className="inline-block"
            />
            <div>
              <div className="text-sm" style={{ color: "var(--brown)", fontFamily: "var(--font-lora), serif" }}>
                Text Quiz Mode
              </div>
              <div className="font-semibold" style={{ color: "var(--carolina-blue)", fontFamily: "var(--font-lora), serif" }}>
                {topic}
              </div>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm" style={{ color: "var(--brown)", fontFamily: "var(--font-lora), serif" }}>
              Question {currentQuestion + 1} of {questions.length}
            </span>
            <span className="text-sm" style={{ color: "var(--brown)", fontFamily: "var(--font-lora), serif" }}>
              {Object.keys(answers).length} answered
            </span>
          </div>
          <div className="w-full h-2 rounded-full" style={{ backgroundColor: "#e0e0e0" }}>
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{
                backgroundColor: "var(--carolina-blue)",
                width: `${((currentQuestion + 1) / questions.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Question Card */}
        {currentQ && (
          <div
            className="rounded-3xl shadow-xl p-8 md:p-12"
            style={{ backgroundColor: "#ffffff" }}
          >
            <div className="mb-4">
              <span
                className="text-xs px-2 py-1 rounded-full font-medium"
                style={{
                  backgroundColor: currentQ.questionType === "mcq" ? "var(--carolina-blue)" : "var(--peach)",
                  color: "#ffffff",
                }}
              >
                {currentQ.questionType === "mcq" ? "Multiple Choice" : "True/False"}
              </span>
            </div>
            <h2 className="mb-6 text-xl font-semibold" style={{ color: "var(--brown)", fontFamily: "var(--font-lora), serif" }}>
              {currentQ.question}
            </h2>

            <div className="space-y-3">
              {currentQ.options.map((option, index) => {
                const isSelected = answers[currentQ.id] === index;
                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(currentQ.id, index)}
                    className="w-full text-left px-4 py-3 rounded-xl transition-all hover:scale-[1.02] border-2 font-medium"
                    style={{
                      backgroundColor: isSelected ? "var(--carolina-blue)" : "#ffffff",
                      color: isSelected ? "#ffffff" : "var(--brown)",
                      borderColor: isSelected ? "var(--carolina-blue)" : "var(--carolina-blue)",
                      fontFamily: "var(--font-lora), serif",
                    }}
                  >
                    {String.fromCharCode(65 + index)}. {option}
                  </button>
                );
              })}
            </div>

            <div className="mt-6">
              <button
                onClick={handleNext}
                disabled={!hasAnswer || isSubmitting}
                className="w-full py-3 px-6 rounded-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                style={{
                  backgroundColor: "var(--peach)",
                  color: "#ffffff",
                  fontFamily: "var(--font-lora), serif",
                }}
              >
                {currentQuestion < questions.length - 1 ? "Next Question" : "Submit Quiz"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
