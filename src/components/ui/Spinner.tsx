import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-10 w-10',
};

export function Spinner({ size = 'md', label, className }: SpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-primary/30 border-t-primary',
          sizeMap[size]
        )}
      />
      {label && (
        <span className="text-xs text-text-muted">{label}</span>
      )}
    </div>
  );
}

export default Spinner;
