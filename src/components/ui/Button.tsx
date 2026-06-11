'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Spinner } from './Spinner';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const variantClasses: Record<string, string> = {
  primary: 'text-white',
  secondary: 'bg-surface hover:bg-surface-alt text-text border border-border',
  ghost: 'bg-transparent hover:bg-surface-alt text-text',
  danger: 'bg-danger hover:bg-red-600 text-white',
  outline: 'border border-border bg-transparent hover:bg-surface-alt text-text',
};

const sizeClasses: Record<string, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-8 py-3.5 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      className,
      children,
      style,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    const isPrimary = variant === 'primary';

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200',
          variantClasses[variant],
          sizeClasses[size],
          !isDisabled && 'hover:scale-[1.02] hover:shadow-md active:scale-[0.98]',
          isDisabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        style={
          isPrimary
            ? {
                background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
                ...style,
              }
            : style
        }
        {...props}
      >
        {isLoading ? (
          <>
            <Spinner size="sm" />
            <span>Processing...</span>
          </>
        ) : (
          <>
            {leftIcon}
            {children}
            {rightIcon}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
