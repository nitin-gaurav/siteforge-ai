import React, { useId } from "react";

export default function Input({ label, hint, error, className = "", ...props }) {
  const id = useId();

  return (
    <div className="grid gap-1.5">
      {label ? (
        <label htmlFor={id} className="text-sm font-medium text-ink/80 select-none">
          {label}
        </label>
      ) : null}
      <input
        id={id}
        className={`h-10 w-full rounded-lg border bg-white px-3 text-sm text-ink placeholder:text-muted/60 outline-none transition-all duration-150
          ${error
            ? "border-red-400 ring-2 ring-red-100 focus:border-red-500 focus:ring-red-100"
            : "border-line hover:border-slate-300 focus:border-slate-300"
          } ${className}`}
        {...props}
      />
      {hint && !error ? <p className="text-xs text-muted">{hint}</p> : null}
      {error ? <p className="text-xs text-red-600 font-medium">{error}</p> : null}
    </div>
  );
}
