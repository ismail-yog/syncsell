'use client';

import { LogOut, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';

export default function SignOutButton() {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSignOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <button 
      onClick={handleSignOut}
      disabled={loading}
      className="text-slate-500 hover:text-white transition-colors disabled:opacity-50"
      title="Sign Out"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
    </button>
  );
}
