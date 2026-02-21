import Link from "next/link";
import Image from "next/image";

type AppBrandProps = {
  asLink?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg" | "hero";
};

const sizeClasses = {
  sm: "text-sm",
  md: "text-lg",
  lg: "text-xl",
  hero: "text-4xl sm:text-5xl",
};

const sizePx = {
  sm: 80,
  md: 66,
  lg: 80,
  hero: 112,
};

export function AppBrand({
  asLink = true,
  className = "",
  size = "md",
}: AppBrandProps) {
  const px = sizePx[size];
  const content = (
    <>
      <Image
        src="/Recall app logo.png"
        alt="Recall"
        width={px}
        height={px}
        className="inline-block shrink-0 align-middle"
      />
      <span className={`ml-1 ${sizeClasses[size]}`}>Recall</span>
    </>
  );

  if (asLink) {
    return (
      <Link
        href="/"
        className={`inline-flex items-center font-semibold text-foreground hover:opacity-80 ${className}`}
      >
        {content}
      </Link>
    );
  }
  return (
    <span
      className={`inline-flex items-center font-semibold text-foreground ${className}`}
    >
      {content}
    </span>
  );
}
