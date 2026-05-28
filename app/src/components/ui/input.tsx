import * as React from "react";
import { cn } from "@/lib/cn";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ className, type = "text", ...props }, ref) {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "flex h-10 w-full rounded-sm bg-bg-tertiary px-3 py-2",
          "text-[16px] text-text-primary placeholder:text-text-muted",
          "border border-border-strong",
          "transition-colors duration-150",
          "focus-visible:outline-none focus-visible:border-border-emphasis",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "aria-[invalid=true]:border-text-primary",
          className,
        )}
        {...props}
      />
    );
  },
);

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, rows = 5, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={cn(
          "flex w-full rounded-sm bg-bg-tertiary px-3 py-2",
          "text-[16px] text-text-primary placeholder:text-text-muted",
          "border border-border-strong",
          "transition-colors duration-150",
          "focus-visible:outline-none focus-visible:border-border-emphasis",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    );
  },
);

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ className, children, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-sm bg-bg-tertiary px-3 py-2",
          "text-[16px] text-text-primary",
          "border border-border-strong",
          "transition-colors duration-150",
          "focus-visible:outline-none focus-visible:border-border-emphasis",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-9",
          className,
        )}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23B8B8B8' stroke-width='1.5'><path d='M6 9l6 6 6-6'/></svg>\")",
        }}
        {...props}
      >
        {children}
      </select>
    );
  },
);

export function Label({
  htmlFor,
  required,
  children,
  className,
}: {
  htmlFor?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        "block text-[12px] font-medium uppercase text-text-secondary mb-2",
        className,
      )}
      style={{ letterSpacing: "0.02em" }}
    >
      {children}
      {required ? (
        <span className="ml-1 text-text-primary" aria-hidden="true">
          •
        </span>
      ) : null}
    </label>
  );
}

export function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="mt-2 text-[14px] text-text-primary">
      {children}
    </p>
  );
}

export function FieldHelp({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 text-[14px] text-text-muted">{children}</p>;
}
