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
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scoreResult, setScoreResult] = useState<AudioQuizScoreResponse | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
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
      // Cleanup: stop recording if active
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try {
          mediaRecorderRef.current.stop();
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

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(audioBlob);
        // Stop all tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      mediaRecorderRef.current = mediaRecorder;
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Could not access microphone. Please check permissions and try again.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  const handleSubmit = async () => {
    if (!question || !audioBlob) {
      alert("Please record an answer before submitting.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await scoreAudioQuiz(
        audioBlob,
        question.question,
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
    setAudioBlob(null);
    setScoreResult(null);
    audioChunksRef.current = [];
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
              {/* Transcribed Text */}
              <div
                className="p-4 rounded-xl text-left mt-4 mb-4"
                style={{ backgroundColor: "var(--beige)" }}
              >
                <p className="text-sm font-semibold mb-2" style={{ color: "var(--brown)", fontFamily: "var(--font-lora), serif" }}>
                  Your Answer:
                </p>
                <p style={{ color: "var(--brown)", fontFamily: "var(--font-lora), serif" }}>{scoreResult.transcribedText}</p>
              </div>

              {/* Eleven Labs Feedback */}
              <div
                className="p-4 rounded-xl text-left mb-4"
                style={{ backgroundColor: scoreResult.isHesitant ? "#ffe0d0" : "#d4edda" }}
              >
                <p className="text-sm font-semibold mb-2" style={{ color: "var(--brown)", fontFamily: "var(--font-lora), serif" }}>
                  <span>Communication Flow</span>
                  <span className="text-xs font-normal ml-2 opacity-70">(Eleven Labs)</span>
                </p>
                <p style={{ color: "var(--brown)", fontFamily: "var(--font-lora), serif" }}>{scoreResult.elevenLabsFeedback}</p>
              </div>

              {/* Gemini Feedback */}
              <div
                className="p-4 rounded-xl text-left mb-4"
                style={{ backgroundColor: "var(--beige)" }}
              >
                <p className="text-sm font-semibold mb-2" style={{ color: "var(--brown)", fontFamily: "var(--font-lora), serif" }}>
                  Articulateness Feedback (Gemini):
                </p>
                <p style={{ color: "var(--brown)", fontFamily: "var(--font-lora), serif" }}>{scoreResult.geminiFeedback}</p>
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
                  fontFamily: "var(--font-lora), serif",
                }}
              >
                Try Again
              </button>
              <button
                onClick={handleBackToHome}
                className="px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 hover:scale-105 font-medium"
                style={{
                  backgroundColor: "var(--carolina-blue)",
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

  if (!question) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center" 
        style={{ 
          background: "radial-gradient(circle at center, #FFFBF0 0%, #FAF0D0 40%, #F0E4B8 70%, #E0D0A0 100%)",
          minHeight: "100vh"
        }}
      >
        <div className="text-center">
          <p style={{ color: "var(--brown)", fontFamily: "var(--font-lora), serif" }}>No question available.</p>
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
                Audio Quiz Mode
              </div>
              <div className="font-semibold" style={{ color: "var(--peach)", fontFamily: "var(--font-lora), serif" }}>
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
          <h2 className="mb-6 text-xl font-semibold text-center" style={{ color: "var(--brown)", fontFamily: "var(--font-lora), serif" }}>
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
                fontFamily: "var(--font-lora), serif",
              }}
            >
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
                  <p style={{ color: "var(--brown)", fontFamily: "var(--font-lora), serif" }}>Recording... Speak your answer</p>
                </>
              ) : audioBlob ? (
                <>
                  <div className="mb-4 text-5xl">✓</div>
                  <p style={{ color: "var(--brown)", fontFamily: "var(--font-lora), serif" }}>
                    Audio recorded ({Math.round(audioBlob.size / 1024)} KB)
                  </p>
                  <audio src={URL.createObjectURL(audioBlob)} controls className="mt-2" />
                </>
              ) : (
                <>
                  <div className="mb-4 text-5xl">🎤</div>
                  <p style={{ color: "var(--brown)", fontFamily: "var(--font-lora), serif" }}>Click the button below to record your answer</p>
                </>
              )}
            </div>

            {/* Control Buttons */}
            <div className="flex flex-col gap-4">
              {!audioBlob && !isRecording && (
                <button
                  onClick={startRecording}
                  className="w-full py-4 px-6 rounded-xl transition-all hover:scale-105 flex items-center justify-center gap-2 font-medium"
                  style={{
                    backgroundColor: "var(--peach)",
                    color: "#ffffff",
                    fontFamily: "var(--font-lora), serif",
                  }}
                >
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
                    fontFamily: "var(--font-lora), serif",
                  }}
                >
                  Stop Recording
                </button>
              )}

              {audioBlob && !isRecording && (
                <>
                  <button
                    onClick={handleTryAgain}
                    className="w-full py-3 px-6 rounded-xl transition-all hover:scale-105 flex items-center justify-center gap-2 font-medium"
                    style={{
                      backgroundColor: "var(--peach)",
                      color: "#ffffff",
                      fontFamily: "var(--font-lora), serif",
                    }}
                  >
                    Record Again
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full py-4 px-6 rounded-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                    style={{
                      backgroundColor: "var(--carolina-blue)",
                      color: "#ffffff",
                      fontFamily: "var(--font-lora), serif",
                    }}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Answer"}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Browser Support Notice */}
          <div className="mt-6 text-center text-sm" style={{ color: "var(--brown)", fontFamily: "var(--font-lora), serif" }}>
            <p>💡 Audio features work best in Chrome, Edge, or Safari</p>
          </div>
        </div>
      </div>
    </div>
  );
}
