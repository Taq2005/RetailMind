import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function PrivacyNote({ className }: { className?: string }) {
  return (
    <p className={cn("flex items-start gap-2 text-xs leading-relaxed text-slate-500", className)}>
      <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
      <span>
        Your files are stored privately in your account and queried in your browser. To write each answer, the AI receives your question, column names, a few example values and the top 20 result rows. It never receives the full file.
      </span>
    </p>
  );
}
