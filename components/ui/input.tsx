import * as React from "react";
import { cn } from "@/lib/utils";

let autoId = 0;

type BaseProps = {
  label: string;
  error?: string;
  className?: string;
  multiline?: boolean;
};

type InputProps = BaseProps &
  Omit<React.InputHTMLAttributes<HTMLInputElement>, keyof BaseProps>;
type TextareaProps = BaseProps &
  Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, keyof BaseProps>;

const fieldClasses =
  "w-full rounded-xl border border-border-subtle bg-surface px-4 py-3 text-foreground placeholder:text-muted/60 backdrop-blur-md transition-colors focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 aria-[invalid=true]:border-red-500/70";

/** Glassmorphic text field with an associated label and error message. */
export function Input({ label, error, className, multiline, id, ...props }: InputProps | TextareaProps) {
  const reactId = React.useId?.() ?? `field-${++autoId}`;
  const fieldId = id ?? reactId;
  const errorId = `${fieldId}-error`;
  const invalid = Boolean(error);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={fieldId} className="text-foreground text-sm font-medium">
        {label}
      </label>
      {multiline ? (
        <textarea
          id={fieldId}
          aria-invalid={invalid}
          aria-describedby={invalid ? errorId : undefined}
          className={cn(fieldClasses, "min-h-28 resize-y")}
          {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input
          id={fieldId}
          aria-invalid={invalid}
          aria-describedby={invalid ? errorId : undefined}
          className={fieldClasses}
          {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
        />
      )}
      {invalid && (
        <p id={errorId} role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
