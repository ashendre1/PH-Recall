"use client";

import { useState, useCallback } from "react";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageList } from "@/components/chat/MessageList";
import { ChatComposer } from "@/components/chat/ChatComposer";
import type { Message, Source } from "@/types/chat";
import { generateQuiz, scoreQuiz } from "@/lib/api";

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = useCallback(async (content: string) => {
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
    };
    setMessages((prev) => [...prev, userMsg]);

    // Check if user wants a quiz
    const lower = content.toLowerCase();
    const wantsQuiz =
      lower.includes("quiz") ||
      lower.includes("practice") ||
      lower.includes("questions on") ||
      lower.includes("test me");

    if (wantsQuiz) {
      setIsLoading(true);
      try {
        // Extract topic from user message
        const topicMatch = content.match(/(?:quiz|practice|questions?)\s+(?:on|about|for)\s+([^.?!]+)/i) ||
                          content.match(/(?:on|about)\s+([^.?!]+)/i);
        const topic = topicMatch ? topicMatch[1].trim() : content;

        // Call API to generate quiz
        const result = await generateQuiz(topic, 5);

        const assistantMsg: Message = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: `Here are ${result.questions.length} multiple choice questions on "${result.topic}". Answer them below.`,
          sources: result.sources,
          inlineQuiz: {
            questions: result.questions,
          },
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } catch (error) {
        console.error("Error generating quiz:", error);
        const errorMsg: Message = {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: `Sorry, I couldn't generate a quiz. ${error instanceof Error ? error.message : "Please try again."}`,
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    } else {
      // For non-quiz messages, show a placeholder response
      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: `I can help you generate quiz questions! Try asking: "quiz on [topic]" or "practice questions on [topic]".`,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    }
  }, []);

  const handleQuizSubmit = useCallback(
    async (messageId: string, answers: Record<string, number>) => {
      const message = messages.find((m) => m.id === messageId);
      if (!message || !message.inlineQuiz) return;

      const { questions } = message.inlineQuiz;

      setIsLoading(true);
      try {
        // Call API to score the quiz
        const result = await scoreQuiz(answers, questions);

        // Update message with scores and feedback
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== messageId || !m.inlineQuiz) return m;

            // Create a map of feedback by question ID
            const feedbackMap: Record<string, string> = {};
            result.results.forEach((r) => {
              feedbackMap[r.questionId] = r.feedback;
            });

            return {
              ...m,
              inlineQuiz: {
                ...m.inlineQuiz,
                submittedAnswers: answers,
                score: result.totalScore,
                feedback: feedbackMap,
              },
            };
          })
        );
      } catch (error) {
        console.error("Error scoring quiz:", error);
        // Fallback to local scoring if API fails
        const score = questions.filter(
          (q) => answers[q.id] === q.correctAnswer
        ).length;
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== messageId || !m.inlineQuiz) return m;
            return {
              ...m,
              inlineQuiz: {
                ...m.inlineQuiz,
                submittedAnswers: answers,
                score,
              },
            };
          })
        );
      } finally {
        setIsLoading(false);
      }
    },
    [messages]
  );

  return (
    <div className="min-h-screen flex flex-col bg-linear-to-b from-zinc-50/50 to-background dark:from-zinc-950/30 dark:to-background">
      <ChatHeader />
      <div className="flex-1 flex justify-center px-4 py-6">
        <div className="w-full max-w-3xl flex flex-col rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-900 shadow-lg min-h-[60vh] overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col min-h-0">
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-4 min-h-0">
                <p className="text-2xl font-medium text-foreground">
                  Start a conversation
                </p>
                <p className="text-base text-zinc-500 dark:text-zinc-400 mt-3 max-w-sm">
                  Ask anything about what you've read. Get answers with sources,
                  or request a quiz when you're ready to test yourself.
                </p>
                <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-5">
                  Your reading, ready to recall.
                </p>
              </div>
            ) : (
              <MessageList
                messages={messages}
                onQuizSubmit={handleQuizSubmit}
              />
            )}
          </div>
          <ChatComposer onSend={handleSend} disabled={isLoading} />
        </div>
      </div>
    </div>
  );
}
