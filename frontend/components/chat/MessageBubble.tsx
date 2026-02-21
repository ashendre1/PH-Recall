import type { Message } from "@/types/chat";
import { SourceChips } from "./SourceChips";
import { InlineQuiz } from "./InlineQuiz";
import { Card } from "@/components/ui/Card";

type MessageBubbleProps = {
  message: Message;
  onQuizSubmit?: (messageId: string, answers: Record<string, number>) => void;
};

export function MessageBubble({ message, onQuizSubmit }: MessageBubbleProps) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="rounded-2xl rounded-br-md bg-foreground text-background px-4 py-3 max-w-[85%]">
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start flex-col gap-3">
      <Card className="max-w-[90%] rounded-2xl rounded-bl-md">
        <p className="text-sm text-foreground whitespace-pre-wrap">
          {message.content}
        </p>
        <SourceChips
          sources={message.sources ?? []}
          noSources={
            message.sources?.length === 0 &&
            message.content.length > 0 &&
            !message.inlineQuiz
          }
        />
      </Card>
      {message.inlineQuiz && onQuizSubmit && (
        <div className="flex justify-start">
          <InlineQuiz
            payload={message.inlineQuiz}
            messageId={message.id}
            onSubmit={onQuizSubmit}
          />
        </div>
      )}
    </div>
  );
}
