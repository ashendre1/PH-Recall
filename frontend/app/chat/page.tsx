"use client";

import { useState, useCallback } from "react";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageList } from "@/components/chat/MessageList";
import { ChatComposer } from "@/components/chat/ChatComposer";
import type { Message, Source, InlineQuizQuestion } from "@/types/chat";

const MOCK_SOURCES: Source[] = [
  { id: "1", title: "Auth0 Docs" },
  { id: "2", title: "MDN Web Security" },
];

/** Backend will specify the number of questions; for now we mock with 4. */
const MOCK_QUIZ_QUESTION_COUNT = 4;

function buildMockQuizQuestions(topic: string): InlineQuizQuestion[] {
  const base: Array<{ text: string; options: string[]; correctAnswer: number }> = [
    {
      text: `What best describes "${topic}" in this context?`,
      options: ["A quiz topic", "A programming language", "A type of food", "None of these"],
      correctAnswer: 0,
    },
    {
      text: "Where do you answer the quiz questions?",
      options: ["On a separate practice page", "In the same chat window", "In an email", "In a PDF"],
      correctAnswer: 1,
    },
    {
      text: "After submitting, you see:",
      options: ["Only a pass/fail", "A score and per-question feedback", "No feedback", "A certificate"],
      correctAnswer: 1,
    },
    {
      text: "How many mock questions are in this quiz?",
      options: ["Two", "Three", "Four", "Five"],
      correctAnswer: 2,
    },
  ];
  return base.slice(0, MOCK_QUIZ_QUESTION_COUNT).map((q, i) => ({
    id: `q-${i + 1}`,
    text: q.text,
    type: "mcq" as const,
    options: q.options,
    correctAnswer: q.correctAnswer,
  }));
}

function createMockReply(userContent: string): Message {
  const lower = userContent.toLowerCase();
  const wantsQuiz =
    lower.includes("quiz") ||
    lower.includes("practice") ||
    lower.includes("questions on");
  const topicMatch = userContent.match(/(?:on|about)\s+([^.?!]+)/i);
  const topic = topicMatch ? topicMatch[1].trim() : "General";

  const msg: Message = {
    id: `mock-${Date.now()}`,
    role: "assistant",
    content: wantsQuiz
      ? `Here are ${MOCK_QUIZ_QUESTION_COUNT} multiple choice questions on "${topic}". Answer them below.`
      : `This is a mock reply (no backend yet). You asked: "${userContent.slice(0, 50)}${userContent.length > 50 ? "…" : ""}". When the backend is connected, answers will be grounded in your saved pages.`,
    sources: MOCK_SOURCES,
  };

  if (wantsQuiz) {
    msg.inlineQuiz = {
      questions: buildMockQuizQuestions(topic),
    };
  }

  return msg;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);

  const handleSend = useCallback((content: string) => {
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
    };
    setMessages((prev) => [...prev, userMsg]);
    const assistantMsg = createMockReply(content);
    setMessages((prev) => [...prev, assistantMsg]);
  }, []);

  const handleQuizSubmit = useCallback(
    (messageId: string, answers: Record<string, number>) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId || !m.inlineQuiz) return m;
          const { questions } = m.inlineQuiz;
          const score = questions.filter(
            (q) => answers[q.id] === q.correctAnswer
          ).length;
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
    },
    []
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
          <ChatComposer onSend={handleSend} />
        </div>
      </div>
    </div>
  );
}
