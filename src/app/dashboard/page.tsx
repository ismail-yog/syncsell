import { createClient } from '@/lib/supabase/server'
import { Package, CheckCircle, TrendingUp, AlertTriangle, Link as LinkIcon } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Link from 'next/link'

export default async function DashboardHome() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch real stats
  const { count: totalProducts } = await supabase
    .from('product_listings')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user?.id || '')

  const { count: optimizedProducts } = await supabase
    .from('product_listings')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user?.id || '')
    .eq('ai_optimized', true)

  const { data: credentials } = await supabase
    .from('store_credentials')
    .select('platform')
    .eq('user_id', user?.id || '')
    .eq('is_active', true)

  const activeStores = credentials?.length || 0
  const isEbayConnected = credentials?.some(c => c.platform === 'ebay')

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div>
          <h1 className="text-3xl font-heading font-thin glow-text">Welcome back! 👋</h1>
          <p className="text-text-muted mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex items-center space-x-3">
          {isEbayConnected && (
            <Link href="/api/ebay/sync">
              <Button variant="primary" className="glow-box flex items-center space-x-2">
                <Package className="w-4 h-4" />
                <span>Import eBay Listings</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Real Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        <Card className="flex flex-col p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-text-muted text-sm uppercase tracking-wider">Total Products</h3>
            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg"><Package className="w-5 h-5" /></div>
          </div>
          <div className="text-3xl font-heading font-bold">{totalProducts || 0}</div>
        </Card>
        
        <Card className="flex flex-col p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-text-muted text-sm uppercase tracking-wider">Optimized</h3>
            <div className="p-2 bg-green-500/10 text-green-500 rounded-lg"><CheckCircle className="w-5 h-5" /></div>
          </div>
          <div className="text-3xl font-heading font-bold">{optimizedProducts || 0}</div>
        </Card>
        
        <Card className="flex flex-col p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-text-muted text-sm uppercase tracking-wider">Active Stores</h3>
            <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg"><TrendingUp className="w-5 h-5" /></div>
          </div>
          <div className="text-3xl font-heading font-bold">{activeStores}</div>
        </Card>
        
        <Card className="flex flex-col p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-text-muted text-sm uppercase tracking-wider">Alerts</h3>
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg"><AlertTriangle className="w-5 h-5" /></div>
          </div>
          <div className="text-3xl font-heading font-bold">0</div>
        </Card>
      </div>

      {/* Connection Call to Action */}
      {!isEbayConnected && (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed border-border/50">
          <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mb-4">
            <LinkIcon className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold mb-2">No Stores Connected</h2>
          <p className="text-text-muted max-w-md mb-6">
            To start optimizing your listings and syncing inventory, you need to connect your eBay account.
          </p>
          <a href="/api/ebay/auth">
            <Button variant="outline" className="flex items-center space-x-2">
              <LinkIcon className="w-4 h-4" />
              <span>Connect eBay Store</span>
            </Button>
          </a>
        </Card>
      )}

      {isEbayConnected && totalProducts === 0 && (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed border-success/30">
          <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mb-4">
            <Package className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold mb-2">eBay Connected!</h2>
          <p className="text-text-muted max-w-md mb-6">
            Your store is connected but you haven't imported any listings yet.
          </p>
          <Link href="/api/ebay/sync">
            <Button variant="primary">Import Listings Now</Button>
          </Link>
        </Card>
      )}
    </div>
  )
}
