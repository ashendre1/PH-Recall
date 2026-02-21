import { AppBrand } from "@/components/AppBrand";

export function ChatHeader() {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-center w-full max-w-4xl mx-auto px-4 py-3 border-b border-black/[0.06] dark:border-white/10 bg-background/95 backdrop-blur">
      <AppBrand size="lg" />
    </header>
  );
}
