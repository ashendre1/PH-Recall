import type { Message } from "@/types/chat";
import { MessageBubble } from "./MessageBubble";

type MessageListProps = {
  messages: Message[];
  onQuizSubmit?: (messageId: string, answers: Record<string, number>) => void;
};

export function MessageList({ messages, onQuizSubmit }: MessageListProps) {
  return (
    <div className="flex flex-col gap-4 py-4 px-4">
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          onQuizSubmit={onQuizSubmit}
        />
      ))}
    </div>
  );
}
