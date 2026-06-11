'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OAuthHandoff() {
  const [status, setStatus] = useState('Finalizing eBay connection...');
  const router = useRouter();

  useEffect(() => {
    const finalize = async () => {
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
      }
    };
    
    finalize();
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border shadow-sm">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
      <h3 className="text-xl font-bold">{status}</h3>
      <p className="text-muted-foreground mt-2">Please do not close this page.</p>
    </div>
  );
}
