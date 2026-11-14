import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset", {
  variants: {
    tone: {
      neutral: "bg-slate-50 text-slate-600 ring-slate-200",
      ink: "bg-ink-50 text-ink-700 ring-ink-100",
      good: "bg-emerald-50 text-emerald-700 ring-emerald-200/70",
      warn: "bg-amber-50 text-amber-800 ring-amber-200/80",
      bad: "bg-rose-50 text-rose-700 ring-rose-200/80",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export function Badge({ className, tone, ...props }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
