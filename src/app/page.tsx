import { AuroraBackground } from '@/components/ui/AuroraBackground';
import Link from 'next/link';
import { ArrowRight, Sparkles, RefreshCw, ShieldCheck, Zap } from 'lucide-react';
import MagneticElement from '@/components/ui/MagneticElement';

export default function Home() {
  return (
    <AuroraBackground>
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-4">
        
        {/* Navigation Bar */}
        <nav className="absolute top-0 w-full p-8 flex justify-between items-center z-50">
          <div className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            SYNCSELL
          </div>
          <div className="flex space-x-4">
            <Link href="/login" className="px-6 py-2 rounded-full bg-white/5 text-white border border-white/10 hover:bg-white/10 transition-colors font-semibold">
              Sign In
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="max-w-5xl mx-auto text-center z-10 mt-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/5 border border-white/10 text-slate-300 text-sm font-semibold mb-8">
            <Sparkles className="w-4 h-4 mr-2 text-primary" />
            The Ultimate Hands-Free eBay Assistant
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-8 leading-tight">
            Automate Your eBay Sales with <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent">Enterprise AI</span>
          </h1>
          
          <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Stop wasting hours writing listings. SyncSell instantly pulls your inventory, uses Claude 3.5 Sonnet to rewrite titles and descriptions for maximum SEO, and publishes directly to your store.
          </p>

          <MagneticElement strength={20}>
            <Link 
              href="/signup" 
              className="inline-flex items-center px-10 py-5 rounded-full bg-primary text-white font-bold text-xl hover:scale-105 transition-all shadow-[0_0_40px_rgba(139,92,246,0.4)] hover:shadow-[0_0_60px_rgba(139,92,246,0.6)]"
            >
              <span>Connect eBay to Start</span>
              <ArrowRight className="w-6 h-6 ml-2" />
            </Link>
          </MagneticElement>
          <p className="text-sm text-slate-500 mt-4">Secure, read/write OAuth connection. No credit card required.</p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto mt-24 z-10">
          
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-colors">
            <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center mb-6 border border-primary/30">
              <RefreshCw className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Real-Time Sync Engine</h3>
            <p className="text-slate-400 leading-relaxed">
              We connect directly to eBay's API to pull your active listings instantly. Zero manual imports, zero CSV files.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-colors">
            <div className="w-12 h-12 bg-secondary/20 rounded-2xl flex items-center justify-center mb-6 border border-secondary/30">
              <Zap className="w-6 h-6 text-secondary" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">AI SEO Optimization</h3>
            <p className="text-slate-400 leading-relaxed">
              Our AI engine stuffs titles with high-converting keywords and writes elite sales copy that ranks higher in Cassini search.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-colors">
            <div className="w-12 h-12 bg-accent/20 rounded-2xl flex items-center justify-center mb-6 border border-accent/30">
              <ShieldCheck className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">VeRO Compliance Guard</h3>
            <p className="text-slate-400 leading-relaxed">
              Never get your account banned again. The AI automatically scans and strips out prohibited keywords and VeRO violations before publishing.
            </p>
          </div>

        </div>
      </div>
    </AuroraBackground>
  );
}
