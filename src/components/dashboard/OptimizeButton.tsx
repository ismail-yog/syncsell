'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const PROGRESS_STATES = [
  "Analyzing keywords...",
  "Writing sales copy...",
  "Polishing tags...",
  "Finalizing SEO..."
];

export default function OptimizeButton({ count }: { count: number }) {
  const [optimizing, setOptimizing] = useState(false);
  const [progressIndex, setProgressIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (optimizing) {
      interval = setInterval(() => {
        setProgressIndex(prev => (prev + 1) % PROGRESS_STATES.length);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [optimizing]);

  const handleOptimize = async () => {
    if (count === 0) return;
    setOptimizing(true);
    setProgressIndex(0);
    
    try {
      const res = await fetch('/api/ai/optimize/batch', { method: 'POST' });
      if (!res.ok) throw new Error('Optimization failed');
      
      // Artificial delay to show off the cool states (normally we'd poll or await the background job)
      await new Promise(resolve => setTimeout(resolve, 8000));
      
      router.refresh();
    } catch (err) {
      console.error(err);
      alert('Failed to start optimization.');
    } finally {
      setOptimizing(false);
    }
  };

  if (count === 0) {
    return (
      <button disabled className="px-4 py-2 rounded-lg bg-green-500/10 text-green-600 font-semibold text-sm border border-green-500/20 flex items-center space-x-2">
        <Sparkles className="w-4 h-4" />
        <span>All Optimized!</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleOptimize}
      disabled={optimizing}
      className={cn(
        "px-4 py-2 rounded-lg font-semibold text-sm flex items-center space-x-2 transition-all hover:scale-[1.02] active:scale-[0.98]",
        optimizing 
          ? "bg-primary text-white glow-primary" 
          : "bg-primary text-white glow-primary"
      )}
    >
      <Sparkles className={cn("w-4 h-4", optimizing && "animate-spin")} />
      <span>
        {optimizing ? PROGRESS_STATES[progressIndex] : `Optimize ${count} Listings`}
      </span>
    </button>
  );
}
