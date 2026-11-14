import { cn } from "@/lib/utils";

/** RetailMind mark: a bold "R" whose leg is a rising bar, with a single amber signal dot. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("h-7 w-7", className)} role="img" aria-label="RetailMind">
      <rect width="32" height="32" rx="8" fill="#26307F" />
      <rect x="0.5" y="0.5" width="31" height="31" rx="7.5" fill="none" stroke="white" strokeOpacity=".16" />
      <path d="M9 22V10h6.2c2.6 0 4.2 1.4 4.2 3.5 0 1.6-.9 2.7-2.3 3.2L21 22h-3.1l-3.2-5H12v5H9Zm3-7.4h3c1.1 0 1.8-.5 1.8-1.4s-.7-1.4-1.8-1.4h-3v2.8Z" fill="#fff" />
      <circle cx="23" cy="10" r="2.2" fill="#F2B24A" />
    </svg>
  );
}

export function Wordmark({ className, collapsed }: { className?: string; collapsed?: boolean }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      {!collapsed && <span className="text-[15px] font-semibold tracking-[-0.03em] text-slate-900">RetailMind</span>}
    </span>
  );
}
