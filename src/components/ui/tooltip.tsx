import * as T from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

export const TooltipProvider = T.Provider;
export function Tip({ label, children, side = "right" }: { label: string; children: React.ReactNode; side?: "top" | "right" | "bottom" | "left" }) {
  return (
    <T.Root delayDuration={120}>
      <T.Trigger asChild>{children}</T.Trigger>
      <T.Portal>
        <T.Content
          side={side}
          sideOffset={8}
          className={cn("z-50 rounded-md bg-slate-900 px-2 py-1 text-[11px] font-medium text-white shadow-lg data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95")}
        >
          {label}
        </T.Content>
      </T.Portal>
    </T.Root>
  );
}
