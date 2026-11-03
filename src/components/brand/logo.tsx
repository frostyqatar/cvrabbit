import { cn } from "@/lib/utils";

export function RabbitMark({
  className,
  tone = "dark",
}: {
  className?: string;
  tone?: "dark" | "light";
}) {
  const plate = tone === "dark" ? "#000f08" : "#f4fff8";
  const face = tone === "dark" ? "#f4fff8" : "#000f08";
  const inner = "#8baaad";

  return (
    <svg
      viewBox="0 0 48 48"
      role="img"
      aria-label="CVRabbit"
      className={cn("size-9", className)}
    >
      <rect width="48" height="48" rx="14" fill={plate} />
      <ellipse cx="18.4" cy="13.4" rx="4.1" ry="9.1" transform="rotate(-12 18.4 13.4)" fill={face} />
      <ellipse cx="30" cy="12.4" rx="4.1" ry="9.1" transform="rotate(11 30 12.4)" fill={face} />
      <ellipse cx="18.6" cy="13.5" rx="1.55" ry="5.4" transform="rotate(-12 18.6 13.5)" fill={inner} />
      <ellipse cx="29.8" cy="12.6" rx="1.55" ry="5.4" transform="rotate(11 29.8 12.6)" fill={inner} />
      <path
        d="M13.2 27.1c0-6.2 4.8-10.3 10.8-10.3s10.8 4.1 10.8 10.3c0 6.6-4.5 12.1-10.8 12.1S13.2 33.7 13.2 27.1Z"
        fill={face}
      />
      <circle cx="20.1" cy="26.4" r="1.35" fill={plate} />
      <circle cx="27.9" cy="26.4" r="1.35" fill={plate} />
      <path
        d="M22.7 31.1c.8.72 1.7 1.08 2.6 1.08 1 0 1.85-.36 2.6-1.08"
        stroke={plate}
        strokeWidth="1.35"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function Logo({
  className,
  tone = "dark",
  wordmarkClassName,
  markClassName,
}: {
  className?: string;
  tone?: "dark" | "light";
  wordmarkClassName?: string;
  markClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <RabbitMark tone={tone} className={markClassName} />
      <span
        className={cn(
          "text-[1.05rem] leading-none tracking-[-0.035em]",
          tone === "dark" ? "text-onyx" : "text-mint",
          wordmarkClassName,
        )}
      >
        <span className="font-serif italic">CV</span>
        <span className="font-sans font-bold">Rabbit</span>
      </span>
    </span>
  );
}

export function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("size-4.5", className)}>
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3.02h3.89c2.27-2.09 3.53-5.17 3.53-8.89Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.89-3.02c-1.08.72-2.46 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.94H1.27v3.11A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.29 14.29a7.2 7.2 0 0 1 0-4.58V6.6H1.27a12 12 0 0 0 0 10.8l4.02-3.11Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.61 4.58 1.79l3.44-3.44A11.97 11.97 0 0 0 12 0 12 12 0 0 0 1.27 6.6l4.02 3.11C6.23 6.88 8.88 4.77 12 4.77Z"
      />
    </svg>
  );
}
