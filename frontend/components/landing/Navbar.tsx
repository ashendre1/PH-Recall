import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { AppBrand } from "@/components/AppBrand";

export function Navbar() {
  return (
    <nav className="flex w-full max-w-6xl mx-auto items-center justify-between py-5 sm:py-6 px-4 sm:px-6">
      <AppBrand size="hero" />
      <div className="flex items-center gap-6">
        <Link
          href="/team"
          className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-foreground"
        >
          Our Team
        </Link>
        <Button href="/chat">Open Chat</Button>
      </div>
    </nav>
  );
}
