'use client'
import { Package, CheckCircle, TrendingUp, AlertTriangle } from 'lucide-react'
import Button from '@/components/ui/Button'
import StatsCard from '@/components/dashboard/StatsCard'
import BeforeAfterCard from '@/components/dashboard/BeforeAfterCard'
import { AnalyticalCharts } from '@/components/dashboard/AnalyticalCharts'

export default function DashboardHome() {
  const mockProduct = {
    id: '1',
    originalTitle: 'Sony Headphones WH-1000XM5 Black',
    optimizedTitle: 'Sony WH-1000XM5 Wireless Noise Canceling Headphones - Black',
    originalDescription: 'Good headphones with noise cancelation.',
    optimizedDescription: '<h2>Immerse Yourself in Pure Sound</h2><p>Experience industry-leading noise cancellation...</p>',
    originalCategory: 'Electronics > Audio',
    mappedCategory: 'Consumer Electronics > Portable Audio & Headphones',
    itemSpecifics: ['Industry-leading noise cancellation', '30-hour battery life', 'Ultra-comfortable fit'],
    seoScore: 95,
    platform: 'shopify' as const
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      {/* Drifting Background Orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none animate-drift" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[100px] pointer-events-none animate-drift" style={{ animationDelay: '5s' }} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div>
          <h1 className="text-3xl font-heading font-thin glow-text">Welcome back! 👋</h1>
          <p className="text-text-muted mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" className="border-primary/50 hover:bg-primary/10 text-primary">Sync Catalog</Button>
          <Button variant="primary" className="glow-box">Run SEO Batch</Button>
        </div>
      </div>

      {/* Stats - Organic Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        <div className="animate-breathe" style={{ animationDelay: '0s' }}>
          <StatsCard title="Total Products" value={1248} icon={<Package />} color="blue" change={12} changeType="positive" />
        </div>
        <div className="animate-breathe" style={{ animationDelay: '1s' }}>
          <StatsCard title="Optimized" value={1180} icon={<CheckCircle />} color="green" change={5} changeType="positive" />
        </div>
        <div className="animate-breathe" style={{ animationDelay: '2s' }}>
          <StatsCard title="Avg SEO Score" value={92} icon={<TrendingUp />} color="purple" change={3} changeType="positive" />
        </div>
        <div className="animate-breathe" style={{ animationDelay: '3s' }}>
          <StatsCard title="Active Alerts" value={2} icon={<AlertTriangle />} color="amber" change={-1} changeType="negative" />
        </div>
      </div>

      {/* Analytical Charts */}
      <div className="relative z-10">
        <AnalyticalCharts />
      </div>

      {/* Recent Optimizations */}
      <div className="relative z-10">
        <h2 className="text-xl font-heading font-thin glow-text mb-4">Recent Optimizations</h2>
        <div className="space-y-6">
          <BeforeAfterCard 
            product={mockProduct} 
            onPushLive={() => console.log('Push live')} 
            isLoading={false}
          />
        </div>
      </div>
    </div>
  )
}
