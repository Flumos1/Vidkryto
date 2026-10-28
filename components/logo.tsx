import Link from "next/link";

export function Logo({
  compact = false,
  className = "",
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link
      href="/"
      aria-label="Vidkryto — на головну"
      className={`group inline-flex items-center gap-2.5 ${className}`}
    >
      <span className="relative grid h-8 w-8 place-items-center rounded-[10px] bg-accent text-accent-fg transition-transform duration-300 group-hover:-rotate-6">
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" aria-hidden>
          <path
            d="M4.5 6.5 12 18l7.5-11.5"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {!compact && (
        <span className="font-display text-[21px] font-semibold tracking-[-0.05em] text-ink">
          vidkryto<span className="text-accent">.</span>
        </span>
      )}
    </Link>
  );
}
