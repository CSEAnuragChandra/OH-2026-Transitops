// src/components/ui/badge.tsx
import { cn } from "@/lib/utils";

type Variant = "default" | "success" | "warning" | "danger" | "info" | "outline";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

const variantClasses: Record<Variant, string> = {
  default: "bg-slate-700 text-slate-200",
  success: "bg-emerald-900/60 text-emerald-400 border border-emerald-800",
  warning: "bg-amber-900/60 text-amber-400 border border-amber-800",
  danger: "bg-red-900/60 text-red-400 border border-red-800",
  info: "bg-blue-900/60 text-blue-400 border border-blue-800",
  outline: "border border-slate-600 text-slate-300",
};

export function Badge({ variant = "default", className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
