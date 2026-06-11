'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';

export default function OAuthHandoff() {
  const [status, setStatus] = useState('Ready to finalize');
  const [loading, setLoading] = useState(false);

  const handleFinalize = async () => {
    setLoading(true);
    setStatus('Finalizing eBay connection...');
    try {
      const res = await fetch('/api/ebay/finalize', { method: 'POST' });
      const data = await res.json();
      
      if (res.ok) {
        setStatus('Successfully connected!');
        window.location.href = '/dashboard?success=ebay_connected';
      } else {
        setStatus('Error: ' + data.error);
        window.location.href = '/dashboard?error=' + encodeURIComponent(data.error);
      }
    } catch (err: any) {
      setStatus('Error finalizing connection.');
      window.location.href = '/dashboard?error=' + encodeURIComponent(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border shadow-sm max-w-md w-full">
      <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-6">
        <span className="text-3xl">✓</span>
      </div>
      <h3 className="text-2xl font-bold mb-2">eBay Authorized</h3>
      <p className="text-muted-foreground mb-8">
        eBay has successfully authorized your account. Click the button below to securely finalize the connection.
      </p>
      
      <button 
        onClick={handleFinalize}
        disabled={loading}
        className="w-full px-6 py-4 rounded-xl bg-primary text-white font-bold hover:scale-[1.02] transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
      >
        <span>{loading ? 'Finalizing...' : 'Complete Connection'}</span>
        {!loading && <ArrowRight className="w-5 h-5" />}
      </button>

      {status !== 'Ready to finalize' && status !== 'Finalizing eBay connection...' && (
        <p className="mt-4 text-sm font-medium text-destructive">{status}</p>
      )}
    </div>
  );
}
