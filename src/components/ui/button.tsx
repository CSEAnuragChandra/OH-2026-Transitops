// src/components/ui/button.tsx
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg" | "icon";
}

const variantClasses = {
  primary: "gradient-brand text-white hover:opacity-90",
  secondary: "bg-slate-700 text-slate-100 hover:bg-slate-600",
  ghost: "bg-transparent text-slate-300 hover:bg-slate-800",
  danger: "bg-red-600 text-white hover:bg-red-700",
  outline: "border border-slate-600 text-slate-300 hover:bg-slate-800",
};

const sizeClasses = {
  sm: "px-3 py-1.5 text-xs rounded-md gap-1.5",
  md: "px-4 py-2 text-sm rounded-lg gap-2",
  lg: "px-5 py-2.5 text-base rounded-lg gap-2",
  icon: "p-2 rounded-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-150",
          "disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
