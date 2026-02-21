type ProgressBarProps = {
  answered: number;
  total: number;
  onGrade: () => void;
  disabled?: boolean;
};

export function ProgressBar({
  answered,
  total,
  onGrade,
  disabled,
}: ProgressBarProps) {
  return (
    <div className="sticky bottom-0 border-t border-black/[0.06] dark:border-white/10 bg-background/95 backdrop-blur p-4">
      <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          Answered {answered} / {total}
        </span>
        <button
          type="button"
          onClick={onGrade}
          disabled={disabled}
          className="rounded-full bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Grade My Answers
        </button>
      </div>
    </div>
  );
}
