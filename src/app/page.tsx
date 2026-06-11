'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import ThemeToggle from '@/components/ui/ThemeToggle'
import Button from '@/components/ui/Button'
import { Sparkles, Eye, Shield, Layers, Play, Package, CheckCircle, TrendingUp, AlertTriangle } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg text-text selection:bg-primary/30">
      {/* Floating Navbar */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-bg/80 border-b border-border transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <span className="font-heading font-bold text-xl gradient-text">EcomAutoPilot</span>
          </div>
          <div className="hidden md:flex space-x-8">
            <Link href="#features" className="text-text-muted hover:text-text transition-colors">Features</Link>
            <Link href="#pricing" className="text-text-muted hover:text-text transition-colors">Pricing</Link>
            <Link href="#demo" className="text-text-muted hover:text-text transition-colors">Demo</Link>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Link href="/login"><Button variant="ghost">Login</Button></Link>
            <Link href="/signup"><Button variant="primary">Get Started</Button></Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-bg pointer-events-none">
          {/* Drifting Background Orbs */}
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[128px] mix-blend-screen animate-drift" />
          <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[128px] mix-blend-screen animate-drift" style={{ animationDelay: '5s', animationDuration: '20s' }} />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-heading font-thin text-5xl md:text-7xl tracking-tight mb-6 glow-text"
          >
            Supercharge Your E-Commerce<br />
            <span className="font-bold gradient-text">Listings with AI</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-xl text-text-muted max-w-2xl mx-auto mb-10 font-light"
          >
            Platform-tailored SEO, real-time inventory sync, and AI-powered category mapping for Shopify & eBay — all on autopilot.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4"
          >
            <Link href="/signup"><Button variant="primary" size="lg" className="glow-box">Start Free Trial</Button></Link>
            <Button variant="outline" size="lg" leftIcon={<Play className="w-4 h-4" />}>Watch Demo</Button>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-border bg-surface-alt/50 backdrop-blur-sm py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <Package className="w-8 h-8 text-primary mb-2" />
              <div className="font-heading font-bold text-3xl">10,000+</div>
              <div className="text-text-muted">Listings Optimized</div>
            </div>
            <div className="flex flex-col items-center">
              <CheckCircle className="w-8 h-8 text-success mb-2" />
              <div className="font-heading font-bold text-3xl">95%</div>
              <div className="text-text-muted">Avg SEO Score</div>
            </div>
            <div className="flex flex-col items-center">
              <Shield className="w-8 h-8 text-accent mb-2" />
              <div className="font-heading font-bold text-3xl">&lt;3s</div>
              <div className="text-text-muted">Sync Speed</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-heading font-bold text-4xl mb-4">Everything you need to scale</h2>
            <p className="text-xl text-text-muted">Enterprise-grade tools for serious sellers.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="p-8 rounded-2xl bg-surface border border-border hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6 text-primary">
                <Eye className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-xl mb-3">Before & After Dashboard</h3>
              <p className="text-text-muted">See exactly how AI transforms your listings with side-by-side comparisons.</p>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="p-8 rounded-2xl bg-surface border border-border hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-6 text-accent">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-xl mb-3">Platform-Tailored SEO</h3>
              <p className="text-text-muted">Custom optimization for Shopify conversions and eBay Cassini rankings.</p>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="p-8 rounded-2xl bg-surface border border-border hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mb-6 text-success">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-xl mb-3">Real-Time Inventory Shield</h3>
              <p className="text-text-muted">Prevent overselling with &lt;3 second cross-platform stock sync.</p>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="p-8 rounded-2xl bg-surface border border-border hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center mb-6 text-warning">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-xl mb-3">AI Category Mapping</h3>
              <p className="text-text-muted">Auto-fill Item Specifics and metafields with enterprise AI.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-primary to-accent text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="font-heading font-bold text-4xl mb-6">Ready to 10x your listings?</h2>
          <Link href="/signup"><Button variant="secondary" size="lg" className="text-primary hover:text-primary-hover bg-white border-white">Start Free Trial</Button></Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-bg border-t border-border py-12 text-center text-text-muted">
        <div className="flex justify-center items-center space-x-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="font-heading font-bold text-lg text-text">EcomAutoPilot</span>
        </div>
        <p>&copy; 2026 EcomAutoPilot. All rights reserved.</p>
      </footer>
    </div>
  )
}
