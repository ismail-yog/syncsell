'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2 } from 'lucide-react';

export default function DemoConnectButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleConnect = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/demo/connect', { method: 'POST' });
      if (res.ok) {
        router.refresh();
      } else {
        alert('Failed to connect demo store');
        setLoading(false);
      }
    } catch (err) {
      alert('Error connecting');
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleConnect}
      disabled={loading}
      className="px-8 py-4 rounded-xl bg-primary text-white font-semibold text-lg hover:scale-[1.02] transition-all glow-primary flex items-center space-x-2 disabled:opacity-50"
    >
      {loading ? (
        <>
          <span>Connecting...</span>
          <Loader2 className="w-5 h-5 animate-spin" />
        </>
      ) : (
        <>
          <span>Connect Demo Store Instantly</span>
          <ArrowRight className="w-5 h-5" />
        </>
      )}
    </button>
  );
}
