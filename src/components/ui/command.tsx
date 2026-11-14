import { Command as C } from "cmdk";
import { cn } from "@/lib/utils";

export const Command = ({ className, ...p }: React.ComponentProps<typeof C>) => (
  <C className={cn("flex w-full flex-col overflow-hidden rounded-2xl bg-white", className)} {...p} />
);
export const CommandInput = ({ className, ...p }: React.ComponentProps<typeof C.Input>) => (
  <C.Input className={cn("h-12 w-full border-b border-slate-100 bg-transparent px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400", className)} {...p} />
);
export const CommandList = ({ className, ...p }: React.ComponentProps<typeof C.List>) => (
  <C.List className={cn("max-h-[360px] overflow-y-auto p-1.5 scrollbar-thin", className)} {...p} />
);
export const CommandEmpty = (p: React.ComponentProps<typeof C.Empty>) => <C.Empty className="px-4 py-10 text-center text-sm text-slate-500" {...p} />;
export const CommandGroup = ({ className, ...p }: React.ComponentProps<typeof C.Group>) => (
  <C.Group className={cn("[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-slate-400", className)} {...p} />
);
export const CommandItem = ({ className, ...p }: React.ComponentProps<typeof C.Item>) => (
  <C.Item className={cn("flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-slate-700 data-[selected=true]:bg-ink-50 data-[selected=true]:text-ink-800 [&_svg]:size-4 [&_svg]:text-slate-400 data-[selected=true]:[&_svg]:text-ink-600", className)} {...p} />
);
