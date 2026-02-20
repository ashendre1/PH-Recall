import { Button } from "@/components/ui/button"

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-xl shadow-sm shadow-black/5">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md shadow-primary/20">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M2 4C2 2.89543 2.89543 2 4 2H7V7H2V4Z"
                fill="currentColor"
                className="text-primary-foreground"
              />
              <path
                d="M9 2H12C13.1046 2 14 2.89543 14 4V7H9V2Z"
                fill="currentColor"
                className="text-primary-foreground/60"
              />
              <path
                d="M2 9H7V14H4C2.89543 14 2 13.1046 2 12V9Z"
                fill="currentColor"
                className="text-primary-foreground/60"
              />
              <path
                d="M9 9H14V12C14 13.1046 13.1046 14 12 14H9V9Z"
                fill="currentColor"
                className="text-primary-foreground/40"
              />
            </svg>
          </div>
          <span className="text-lg font-semibold tracking-tight font-serif text-foreground">
            SmartSign
          </span>
        </div>
        <Button variant="ghost" size="sm" className="text-[#8a6b6b] hover:text-foreground" asChild>
            <a href="#upload">Try it</a>
          </Button>
      </nav>
    </header>
  )
}
