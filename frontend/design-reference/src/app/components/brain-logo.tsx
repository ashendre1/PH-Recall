export function BrainLogo({ className = "", size = 80 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Brain outline */}
      <path
        d="M30 25C25 25 20 30 20 35C20 37 20.5 38.5 21.5 40C18 42 15 46 15 50C15 54 17 57 20 59C18 61 17 64 17 67C17 72 21 76 26 76C26 80 28 83 31 85C34 87 38 88 42 88H58C62 88 66 87 69 85C72 83 74 80 74 76C79 76 83 72 83 67C83 64 82 61 80 59C83 57 85 54 85 50C85 46 82 42 78.5 40C79.5 38.5 80 37 80 35C80 30 75 25 70 25C67 25 64 26.5 62 29C58 26 53 24 48 24C43 24 38 26 34 29C32 26.5 29 25 26 25Z"
        fill="#56A0D3"
        stroke="#6B4423"
        strokeWidth="2"
      />
      
      {/* Left brain hemisphere details */}
      <path
        d="M28 40C28 40 32 38 35 40C38 42 40 45 40 48"
        stroke="#FFB088"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M25 52C25 52 28 50 32 52C35 54 37 57 37 60"
        stroke="#FFB088"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      
      {/* Right brain hemisphere details */}
      <path
        d="M72 40C72 40 68 38 65 40C62 42 60 45 60 48"
        stroke="#FFB088"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M75 52C75 52 72 50 68 52C65 54 63 57 63 60"
        stroke="#FFB088"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      
      {/* Center connection */}
      <path
        d="M45 35C45 35 47 32 50 32C53 32 55 35 55 35"
        stroke="#6B4423"
        strokeWidth="2"
        strokeLinecap="round"
      />
      
      {/* Fun sparkles/stars */}
      <circle cx="22" cy="32" r="2" fill="#FFB088" />
      <circle cx="78" cy="32" r="2" fill="#FFB088" />
      <path d="M50 18 L51 21 L50 20 L49 21 Z" fill="#FFB088" />
      
      {/* Happy face elements */}
      <circle cx="40" cy="55" r="3" fill="#6B4423" />
      <circle cx="60" cy="55" r="3" fill="#6B4423" />
      <path
        d="M42 68C42 68 46 72 50 72C54 72 58 68 58 68"
        stroke="#6B4423"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
