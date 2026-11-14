import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, type, ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn(
      "flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-900 shadow-sm transition-[border-color,box-shadow] placeholder:text-slate-400 hover:border-slate-300 focus-visible:border-ink-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ink-100 disabled:opacity-50 aria-[invalid=true]:border-rose-400 aria-[invalid=true]:ring-rose-100",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";
