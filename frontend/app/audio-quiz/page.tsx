"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { generateQuiz, scoreAudioQuiz } from "@/lib/api";
import type { QuizQuestion, AudioQuizScoreResponse } from "@/types/quiz";

export default function AudioQuizPage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scoreResult, setScoreResult] = useState<AudioQuizScoreResponse | null>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    const storedTopic = sessionStorage.getItem("quizTopic");
    if (storedTopic) {
      setTopic(storedTopic);
      loadQuiz(storedTopic);
    } else {
      router.push("/");
    }

    // Initialize speech synthesis
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      synthRef.current = window.speechSynthesis;
    }

    return () => {
      // Cleanup: stop recognition if active
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors during cleanup
        }
      }
    };
  }, [router]);

  const loadQuiz = async (quizTopic: string) => {
    setIsLoading(true);
    try {
      const result = await generateQuiz(quizTopic, "audio", 1);
      if (result.questions.length > 0) {
        setQuestion(result.questions[0]);
      } else {
        throw new Error("No question generated");
      }
    } catch (error) {
      console.error("Error loading quiz:", error);
      alert("Failed to load quiz. Please try again.");
      router.push("/");
    } finally {
      setIsLoading(false);
    }
  };

  const speakQuestion = useCallback(() => {
    if (!question || !synthRef.current) return;

    setIsPlaying(true);
    const utterance = new SpeechSynthesisUtterance(question.question);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    synthRef.current.speak(utterance);
  }, [question]);

  const startRecording = useCallback(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in your browser. Please use Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscript((prev) => finalTranscript || interimTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsRecording(false);
      if (event.error === "no-speech") {
        alert("No speech detected. Please try again.");
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
    setIsRecording(true);
    recognitionRef.current = recognition;
  }, []);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  const handleSubmit = async () => {
    if (!question || !transcript.trim()) {
      alert("Please record an answer before submitting.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await scoreAudioQuiz(
        question.question,
        transcript,
        topic,
        question.paragraphIds || []
      );
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
    setTranscript("");
    setScoreResult(null);
    if (topic) {
      loadQuiz(topic);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--beige)" }}>
        <div className="text-center">
          <p style={{ color: "var(--brown)" }}>Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (scoreResult) {
    const percentage = Math.round(scoreResult.score * 100);
    return (
      <div className="min-h-screen" style={{ backgroundColor: "var(--beige)" }}>
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div
            className="rounded-3xl shadow-xl p-8 md:p-12 text-center"
            style={{ backgroundColor: "#ffffff" }}
          >
            <div className="flex justify-center mb-6">
              <Image
                src="/Recall app logo.png"
                alt="Recall"
                width={100}
                height={100}
                className="inline-block"
              />
            </div>
            <h1 className="mb-4 text-2xl font-semibold" style={{ color: "var(--brown)" }}>
              Quiz Complete! 🎉
            </h1>
            <div className="mb-8">
              <div
                className="text-6xl mb-4 font-bold"
                style={{ color: "var(--peach)" }}
              >
                {percentage}%
              </div>
              <p className="text-xl mb-4" style={{ color: "var(--brown)" }}>
                {percentage >= 80
                  ? "Excellent answer! Well done!"
                  : percentage >= 60
                  ? "Good job! Keep practicing!"
                  : "Good effort! Review the topic and try again!"}
              </p>
              <div
                className="p-4 rounded-xl text-left mt-4"
                style={{ backgroundColor: "var(--beige)" }}
              >
                <p className="text-sm font-semibold mb-2" style={{ color: "var(--brown)" }}>
                  Feedback:
                </p>
                <p style={{ color: "var(--brown)" }}>{scoreResult.textFeedback}</p>
              </div>
              {scoreResult.audioFeedbackUrl && (
                <div className="mt-4">
                  <audio controls src={scoreResult.audioFeedbackUrl} className="w-full" />
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleTryAgain}
                className="px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 hover:scale-105 font-medium"
                style={{
                  backgroundColor: "var(--peach)",
                  color: "#ffffff",
                }}
              >
                <span>🔄</span>
                Try Again
              </button>
              <button
                onClick={handleBackToHome}
                className="px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 hover:scale-105 font-medium"
                style={{
                  backgroundColor: "var(--carolina-blue)",
                  color: "#ffffff",
                }}
              >
                <span>←</span>
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--beige)" }}>
        <div className="text-center">
          <p style={{ color: "var(--brown)" }}>No question available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--beige)" }}>
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleBackToHome}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:scale-105 font-medium"
            style={{
              backgroundColor: "var(--peach)",
              color: "#ffffff",
            }}
          >
            <span>←</span>
            Home
          </button>
          <div className="flex items-center gap-3">
            <Image
              src="/Recall app logo.png"
              alt="Recall"
              width={50}
              height={50}
              className="inline-block"
            />
            <div>
              <div className="text-sm" style={{ color: "var(--brown)" }}>
                Audio Quiz Mode
              </div>
              <div className="font-semibold" style={{ color: "var(--peach)" }}>
                {topic}
              </div>
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div
          className="rounded-3xl shadow-xl p-8 md:p-12"
          style={{ backgroundColor: "#ffffff" }}
        >
          <h2 className="mb-6 text-xl font-semibold text-center" style={{ color: "var(--brown)" }}>
            {question.question}
          </h2>

          {/* Play Question Button */}
          <div className="flex justify-center mb-8">
            <button
              onClick={speakQuestion}
              disabled={isPlaying || isRecording}
              className="px-8 py-4 rounded-full transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 font-medium"
              style={{
                backgroundColor: "var(--carolina-blue)",
                color: "#ffffff",
              }}
            >
              <span className={isPlaying ? "animate-pulse" : ""}>🔊</span>
              {isPlaying ? "Playing..." : "Listen to Question"}
            </button>
          </div>

          {/* Recording Area */}
          <div className="space-y-4">
            <div
              className="p-6 rounded-xl min-h-[150px] flex flex-col items-center justify-center"
              style={{
                backgroundColor: isRecording ? "#ffe0d0" : "var(--beige)",
                border: `2px solid ${isRecording ? "var(--peach)" : "var(--carolina-blue)"}`,
              }}
            >
              {isRecording ? (
                <>
                  <div className="animate-pulse mb-4 text-5xl">🎤</div>
                  <p style={{ color: "var(--brown)" }}>Recording... Speak your answer</p>
                </>
              ) : transcript ? (
                <>
                  <div className="mb-4 text-5xl">✓</div>
                  <p className="text-center" style={{ color: "var(--brown)" }}>
                    {transcript}
                  </p>
                </>
              ) : (
                <>
                  <div className="mb-4 text-5xl">🎤</div>
                  <p style={{ color: "var(--brown)" }}>Click the button below to record your answer</p>
                </>
              )}
            </div>

            {/* Control Buttons */}
            <div className="flex flex-col gap-4">
              {!transcript && !isRecording && (
                <button
                  onClick={startRecording}
                  className="w-full py-4 px-6 rounded-xl transition-all hover:scale-105 flex items-center justify-center gap-2 font-medium"
                  style={{
                    backgroundColor: "var(--peach)",
                    color: "#ffffff",
                  }}
                >
                  <span>🎤</span>
                  Start Recording
                </button>
              )}

              {isRecording && (
                <button
                  onClick={stopRecording}
                  className="w-full py-4 px-6 rounded-xl transition-all hover:scale-105 flex items-center justify-center gap-2 font-medium"
                  style={{
                    backgroundColor: "var(--brown)",
                    color: "#ffffff",
                  }}
                >
                  <span>⏹</span>
                  Stop Recording
                </button>
              )}

              {transcript && !isRecording && (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full py-4 px-6 rounded-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                  style={{
                    backgroundColor: "var(--carolina-blue)",
                    color: "#ffffff",
                  }}
                >
                  {isSubmitting ? "Submitting..." : "Submit Answer"}
                </button>
              )}
            </div>
          </div>

          {/* Browser Support Notice */}
          <div className="mt-6 text-center text-sm" style={{ color: "var(--brown)" }}>
            <p>💡 Audio features work best in Chrome, Edge, or Safari</p>
          </div>
        </div>
      </div>
    </div>
  );
}
