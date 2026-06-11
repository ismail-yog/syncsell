import { Shield, Link as LinkIcon } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function InventoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch store credentials for the user
  const { data: credentials } = await supabase
    .from('store_credentials')
    .select('platform, is_active')
    .eq('user_id', user?.id || '')
    .eq('is_active', true)

  const isEbayConnected = credentials?.some(c => c.platform === 'ebay')

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Shield className="w-8 h-8 text-success" />
            <h1 className="text-3xl font-heading font-bold">Real-Time Inventory Shield</h1>
          </div>
          <p className="text-text-muted">Cross-platform stock sync in &lt;3 seconds</p>
        </div>
        <Button variant="primary">Sync All Now</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-success/50">
          <h3 className="font-bold text-lg mb-2 text-success">Shopify</h3>
          <p className="text-text-muted text-sm mb-4">Not Connected</p>
          <div className="flex justify-between items-center">
            <Badge variant="neutral">Pending</Badge>
            <span className="text-sm">0 products</span>
          </div>
        </Card>
        
        <Card className={isEbayConnected ? "border-blue-500/50" : "border-border"}>
          <h3 className="font-bold text-lg mb-2 text-blue-500">eBay</h3>
          <p className="text-text-muted text-sm mb-4">eBay US</p>
          <div className="flex justify-between items-center">
            {isEbayConnected ? (
              <>
                <Badge variant="success">Connected</Badge>
                <span className="text-sm">Ready to Sync</span>
              </>
            ) : (
              <a href="/api/ebay/auth">
                <Button variant="outline" className="flex items-center space-x-2">
                  <LinkIcon className="w-4 h-4" />
                  <span>Connect eBay</span>
                </Button>
              </a>
            )}
          </div>
        </Card>
      </div>

      <Card padding="md">
        <h3 className="font-bold text-lg mb-4">Inventory Status</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-sm text-text-muted border-b border-border">
              <tr>
                <th className="pb-3 font-medium">Product</th>
                <th className="pb-3 font-medium">SKU</th>
                <th className="pb-3 font-medium">Shopify Stock</th>
                <th className="pb-3 font-medium">eBay Stock</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b border-border/50">
                <td className="py-4 text-text-muted" colSpan={5}>
                  Connect a store to view inventory status.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
