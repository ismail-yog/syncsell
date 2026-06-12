'use client';

import { useState } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function PushToEbayButton({ 
  listingId, 
  title, 
  description 
}: { 
  listingId: string;
  title: string;
  description: string;
}) {
  const [status, setStatus] = useState<'idle' | 'pushing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handlePush = async () => {
    setStatus('pushing');
    setErrorMessage('');

    try {
      const res = await fetch('/api/ebay/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, title, description }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to push to eBay');
      }

      setStatus('success');
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err.message);
    }
  };

  if (status === 'success') {
    return (
      <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-500/10 text-green-500 border border-green-500/20">
        <CheckCircle2 className="w-4 h-4" />
        <span>Live</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <button 
        onClick={handlePush}
        className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-colors"
        title={errorMessage}
      >
        <AlertCircle className="w-4 h-4" />
        <span>Retry</span>
      </button>
    );
  }

  return (
    <button 
      onClick={handlePush}
      disabled={status === 'pushing'}
      className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary/20 text-white border border-primary/30 hover:bg-primary/30 transition-colors disabled:opacity-50"
    >
      {status === 'pushing' ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <UploadCloud className="w-4 h-4" />
      )}
      <span>{status === 'pushing' ? 'Pushing...' : 'Push to eBay'}</span>
    </button>
  );
}
