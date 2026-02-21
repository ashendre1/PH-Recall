type CardProps = {
  className?: string;
  children: React.ReactNode;
};

export function Card({ className = "", children }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-zinc-900/80 shadow-sm p-6 ${className}`.trim()}
    >
      {children}
    </div>
  );
}
