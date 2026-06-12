'use client';

import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function RefreshDashboardButton() {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 1000); // Artificial delay to show spin
  };

  return (
    <button 
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20 hover:bg-white/20 hover:scale-105 transition-all shadow-lg hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] disabled:opacity-50 group"
      title="Refresh Dashboard"
    >
      <RefreshCw className={`w-5 h-5 text-white ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
    </button>
  );
}
