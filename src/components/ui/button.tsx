import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-[13px] font-medium transition-[transform,box-shadow,background-color,color,border-color] duration-150 ease-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 select-none",
  {
    variants: {
      variant: {
        default: "bg-ink-700 text-white shadow-[0_1px_0_rgb(255_255_255/.18)_inset,0_1px_2px_rgb(18_23_68/.4)] hover:bg-ink-600 hover:shadow-[0_1px_0_rgb(255_255_255/.2)_inset,0_6px_16px_-6px_rgb(38_48_127/.55)]",
        outline: "border border-slate-200 bg-white text-slate-800 shadow-sm hover:border-slate-300 hover:bg-slate-50",
        ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
        subtle: "bg-slate-100 text-slate-700 hover:bg-slate-200/70",
        danger: "bg-rose-600 text-white hover:bg-rose-700",
        link: "text-ink-700 underline-offset-4 hover:underline px-0",
      },
      size: { default: "h-9 px-3.5", sm: "h-8 px-3 text-xs", lg: "h-11 px-5 text-sm", icon: "h-9 w-9" },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
});
Button.displayName = "Button";
