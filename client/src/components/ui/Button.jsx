import React from "react";
import { Loader2 } from "lucide-react";

const variants = {
  primary:
    "bg-accent text-white shadow-sm hover:bg-accent-hover hover:shadow-md hover:-translate-y-px active:translate-y-0 active:shadow-sm",
  secondary:
    "border border-line bg-white text-ink shadow-sm hover:border-accent/30 hover:bg-panel hover:shadow-md active:shadow-sm",
  ghost:
    "text-muted hover:bg-panel hover:text-ink active:bg-line/60",
  danger:
    "bg-red-500 text-white shadow-sm hover:bg-red-600 hover:-translate-y-px active:translate-y-0"
};

export default function Button({
  children,
  className = "",
  loading = false,
  variant = "primary",
  size = "md",
  ...props
}) {
  const sizeClasses = size === "sm"
    ? "h-8 px-3 text-xs gap-1.5 rounded-md"
    : size === "lg"
    ? "h-12 px-6 text-base gap-2.5 rounded-xl"
    : "h-10 px-4 text-sm gap-2 rounded-lg";

  return (
    <button
      className={`inline-flex items-center justify-center font-semibold transition-all duration-150 ease-spring disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:transform-none ${sizeClasses} ${variants[variant]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin opacity-80" /> : null}
      {children}
    </button>
  );
}
