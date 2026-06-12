import { ReactNode } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AuroraBackground } from '@/components/ui/AuroraBackground';
import { LayoutDashboard, PackageSearch, Sparkles, Settings, LogOut, Receipt } from 'lucide-react';
import MagneticElement from '@/components/ui/MagneticElement';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <AuroraBackground>
      <div className="flex h-screen w-full overflow-hidden p-4 gap-6">
        
        {/* Floating Sidebar */}
        <aside className="w-64 flex-shrink-0 flex flex-col bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative z-20">
          <div className="p-6">
            <Link href="/dashboard" className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              SYNCSELL
            </Link>
          </div>
          
          <nav className="flex-1 px-4 space-y-2 mt-4">
            <NavItem href="/dashboard" icon={<LayoutDashboard className="w-5 h-5" />} label="Command Center" active />
          </nav>
          
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center space-x-3 p-3 rounded-2xl bg-white/5 border border-white/5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-xs font-bold text-white">
                {user.email?.[0].toUpperCase()}
              </div>
              <div className="flex-1 overflow-hidden text-xs text-slate-300 font-medium truncate">
                {user.email}
              </div>
              <button className="text-slate-500 hover:text-white transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-black/20 backdrop-blur-3xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative z-20">
          <header className="h-20 border-b border-white/10 flex items-center justify-between px-8 bg-black/20">
            <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard</h1>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search network..." 
                  className="w-64 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
            </div>
          </header>
          
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            {children}
          </div>
        </main>
        
      </div>
    </AuroraBackground>
  );
}

function NavItem({ href, icon, label, active = false }: { href: string, icon: ReactNode, label: string, active?: boolean }) {
  return (
    <MagneticElement strength={5}>
      <Link 
        href={href}
        className={`flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all duration-300 w-full ${
          active 
            ? 'bg-primary/20 text-white border border-primary/30 shadow-[0_0_15px_rgba(139,92,246,0.3)]' 
            : 'text-slate-400 hover:text-white hover:bg-white/5'
        }`}
      >
        {icon}
        <span className="font-semibold text-sm tracking-wide">{label}</span>
      </Link>
    </MagneticElement>
  );
}
