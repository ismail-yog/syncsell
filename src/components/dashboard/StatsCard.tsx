'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  change: number;
  changeType: 'positive' | 'negative' | 'neutral';
  color: 'blue' | 'green' | 'purple' | 'amber';
}

const colorMap = {
  blue: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-500',
    glow: '0 0 24px rgba(59, 130, 246, 0.25)',
  },
  green: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-500',
    glow: '0 0 24px rgba(16, 185, 129, 0.25)',
  },
  purple: {
    bg: 'bg-violet-500/10',
    text: 'text-violet-500',
    glow: '0 0 24px rgba(139, 92, 246, 0.25)',
  },
  amber: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-500',
    glow: '0 0 24px rgba(245, 158, 11, 0.25)',
  },
};

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export default function StatsCard({
  title,
  value,
  icon,
  change,
  changeType,
  color,
}: StatsCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const colors = colorMap[color];

  useEffect(() => {
    const duration = 1500;
    let startTime: number | null = null;
    let animationId: number;

    const animate = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(1, elapsed / duration);
      const easedProgress = easeOutCubic(progress);

      setDisplayValue(Math.round(easedProgress * value));

      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animationId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationId);
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'bg-surface border border-border rounded-2xl p-6 transition-shadow duration-300'
      )}
      style={{
        boxShadow: isHovered ? colors.glow : undefined,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Icon */}
      <div
        className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center',
          colors.bg,
          colors.text
        )}
      >
        {icon}
      </div>

      {/* Value */}
      <div className="text-3xl font-bold font-heading mt-4">
        {displayValue.toLocaleString()}
      </div>

      {/* Title */}
      <div className="text-sm text-text-muted mt-1">{title}</div>

      {/* Change */}
      <div className="flex items-center gap-1 mt-2 text-sm">
        {changeType === 'positive' && (
          <>
            <ArrowUpRight size={16} className="text-emerald-500" />
            <span className="text-emerald-500">+{change}%</span>
          </>
        )}
        {changeType === 'negative' && (
          <>
            <ArrowDownRight size={16} className="text-red-500" />
            <span className="text-red-500">{change}%</span>
          </>
        )}
        {changeType === 'neutral' && (
          <span className="text-text-muted">{change}%</span>
        )}
      </div>
    </motion.div>
  );
}
