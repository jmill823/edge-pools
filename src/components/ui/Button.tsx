import { ButtonHTMLAttributes, forwardRef } from "react";

const variants = {
  primary: "bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-bold hover:brightness-105 focus-visible:ring-[#10B981]",
  secondary: "border border-border text-text-primary hover:bg-surface-alt focus-visible:ring-accent-primary",
  destructive: "border border-accent-danger text-accent-danger hover:bg-red-50 focus-visible:ring-accent-danger",
  outline: "border border-border text-text-secondary hover:bg-surface-alt focus-visible:ring-accent-primary",
} as const;

type Variant = keyof typeof variants;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", loading = false, disabled, className = "", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-center gap-2
          rounded-btn px-5 py-2.5 font-sans text-sm font-medium
          min-h-[44px]
          transition-all duration-200
          active:scale-[0.98]
          cursor-pointer
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variants[variant]}
          ${className}
        `}
        {...props}
      >
        {loading && (
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
