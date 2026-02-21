"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import type { ChatMode } from "@/types/chat";

type ChatComposerProps = {
  onSend: (content: string) => void;
  disabled?: boolean;
};

const MODES: { value: ChatMode; label: string }[] = [
  { value: "explain", label: "Explain" },
  { value: "quick-quiz", label: "Quick Quiz" },
  { value: "practice-set", label: "Practice Set" },
];

export function ChatComposer({ onSend, disabled }: ChatComposerProps) {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<ChatMode>("explain");

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput("");
  }, [input, onSend, disabled]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <div className="shrink-0 border-t border-black/5 dark:border-white/10 p-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMode(m.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                mode === m.value
                  ? "bg-foreground text-background"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about what you've read..."
            rows={2}
            className="flex-1 resize-none rounded-2xl border border-black/10 dark:border-white/15 bg-white dark:bg-zinc-900 px-4 py-3 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-foreground/20"
            disabled={disabled}
          />
          <Button
            variant="primary"
            onClick={handleSubmit}
            className="self-end"
            disabled={disabled || !input.trim()}
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
