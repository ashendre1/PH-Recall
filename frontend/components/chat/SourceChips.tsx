import type { Source } from "@/types/chat";

type SourceChipsProps = {
  sources: Source[];
  /** When true, show a single "no sources" chip */
  noSources?: boolean;
};

export function SourceChips({ sources, noSources }: SourceChipsProps) {
  if (noSources) {
    return (
      <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
        Could not find this in your saved pages.
      </p>
    );
  }
  if (!sources.length) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {sources.map((s) => (
        <span
          key={s.id}
          className="inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-600 dark:text-zinc-400"
        >
          {s.title}
        </span>
      ))}
    </div>
  );
}
