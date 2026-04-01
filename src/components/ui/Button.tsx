import { ButtonHTMLAttributes, forwardRef } from "react";

const variants = {
  primary: "bg-green-800 text-white hover:bg-green-900 focus-visible:ring-green-600",
  secondary: "border border-green-300 text-green-800 hover:bg-green-50 focus-visible:ring-green-400",
  destructive: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500",
  outline: "border border-green-200 text-green-700 hover:bg-green-50 focus-visible:ring-green-400",
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
          rounded-md px-4 py-2.5 text-sm font-semibold
          min-h-[44px]
          transition-colors
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
