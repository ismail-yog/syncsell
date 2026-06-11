import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/* ─── Card ──────────────────────────────────────────── */

interface CardProps {
  variant?: 'default' | 'glass' | 'gradient';
  padding?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: ReactNode;
}

const variantClasses: Record<string, string> = {
  default: 'bg-surface border border-border',
  glass:
    'bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10',
  gradient: 'bg-surface border border-border gradient-border',
};

const paddingClasses: Record<string, string> = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({
  variant = 'default',
  padding,
  className,
  children,
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg',
        variantClasses[variant],
        padding && paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  );
}

/* ─── CardHeader ────────────────────────────────────── */

interface CardSectionProps {
  className?: string;
  children?: ReactNode;
}

export function CardHeader({ className, children }: CardSectionProps) {
  return (
    <div className={cn('px-6 py-4 border-b border-border', className)}>
      {children}
    </div>
  );
}

/* ─── CardBody ──────────────────────────────────────── */

export function CardBody({ className, children }: CardSectionProps) {
  return <div className={cn('p-6', className)}>{children}</div>;
}

/* ─── CardFooter ────────────────────────────────────── */

export function CardFooter({ className, children }: CardSectionProps) {
  return (
    <div className={cn('px-6 py-4 border-t border-border', className)}>
      {children}
    </div>
  );
}

export default Card;
