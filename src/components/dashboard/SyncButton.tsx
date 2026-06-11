'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SyncButtonProps {
  variant?: 'primary' | 'secondary';
}

export default function SyncButton({ variant = 'primary' }: SyncButtonProps) {
  const [syncing, setSyncing] = useState(false);
  const router = useRouter();

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/ebay/sync', { method: 'POST' });
      if (!res.ok) throw new Error('Sync failed');
      router.refresh();
    } catch (err) {
      console.error(err);
      alert('Failed to sync listings. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const isPrimary = variant === 'primary';

  return (
    <button
      onClick={handleSync}
      disabled={syncing}
      className={cn(
        "flex items-center space-x-2 font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none",
        isPrimary 
          ? "px-8 py-4 rounded-xl bg-secondary text-white text-lg glow-secondary" 
          : "px-4 py-2 rounded-lg bg-white border shadow-sm text-muted-foreground hover:text-foreground"
      )}
    >
      <RefreshCw className={cn("w-5 h-5", syncing && "animate-spin")} />
      <span>{syncing ? 'Syncing...' : 'Sync Listings'}</span>
    </button>
  );
}
