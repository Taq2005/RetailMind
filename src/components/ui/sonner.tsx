import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: "!rounded-xl !border !border-slate-200 !bg-white !text-[13px] !text-slate-800 !shadow-[0_16px_40px_-14px_rgb(15_23_42/.3)]",
          description: "!text-slate-500",
        },
      }}
    />
  );
}
