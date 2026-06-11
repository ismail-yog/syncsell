import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      className,
      id,
      ...props
    },
    ref
  ) => {
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-text mb-1.5"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={id}
            className={cn(
              'w-full bg-surface dark:bg-surface-alt border border-border rounded-xl px-4 py-3 text-text placeholder:text-text-muted/60 transition-all duration-200',
              'focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none',
              !!leftIcon && 'pl-10',
              !!rightIcon && 'pr-10',
              !!error && 'border-danger focus:ring-danger/50',
              className
            )}
            {...props}
          />

          {rightIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
              {rightIcon}
            </span>
          )}
        </div>

        {error && <p className="text-xs text-danger mt-1">{error}</p>}
        {!error && helperText && (
          <p className="text-xs text-text-muted mt-1">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
