import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

const variants = {
  primary: "bg-accent text-white hover:bg-accent-hover focus-visible:ring-accent",
  secondary: "bg-surface-2 text-text-primary border border-border hover:bg-surface-3 focus-visible:ring-border-emphasis",
  ghost: "text-text-secondary hover:bg-surface-2 hover:text-text-primary focus-visible:ring-border-emphasis",
  danger: "bg-error text-white hover:brightness-110 focus-visible:ring-error",
  success: "bg-success text-white hover:brightness-110 focus-visible:ring-success",
} as const;

const sizes = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-9 px-4 text-sm gap-2",
  lg: "h-10 px-5 text-sm gap-2",
  icon: "h-9 w-9 justify-center",
} as const;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading = false, leftIcon, rightIcon, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex cursor-pointer items-center justify-center rounded-button font-medium transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0",
          "disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {isLoading ? <Loader2 size={14} className="animate-spin" /> : leftIcon}
        {size !== "icon" && children}
        {!isLoading && rightIcon}
      </button>
    );
  },
);

Button.displayName = "Button";
