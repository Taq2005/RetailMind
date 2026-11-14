import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

export function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn("peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-transparent bg-slate-300 transition-colors data-[state=checked]:bg-ink-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ink-100", className)}
      {...props}
    >
      <SwitchPrimitive.Thumb className="pointer-events-none block h-4 w-4 translate-x-0.5 rounded-full bg-white shadow transition-transform duration-200 [transition-timing-function:cubic-bezier(.3,1.5,.5,1)] data-[state=checked]:translate-x-[18px]" />
    </SwitchPrimitive.Root>
  );
}
