'use client'
import { Shield } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

export default function InventoryPage() {
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
          <p className="text-text-muted text-sm mb-4">store.myshopify.com</p>
          <div className="flex justify-between items-center">
            <Badge variant="success">Connected</Badge>
            <span className="text-sm">1,248 products</span>
          </div>
        </Card>
        <Card className="border-blue-500/50">
          <h3 className="font-bold text-lg mb-2 text-blue-500">eBay</h3>
          <p className="text-text-muted text-sm mb-4">eBay US</p>
          <div className="flex justify-between items-center">
            <Badge variant="success">Connected</Badge>
            <span className="text-sm">1,180 listings</span>
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
                <td className="py-4">Sony WH-1000XM5</td>
                <td className="py-4 text-text-muted">SONY-WH-B</td>
                <td className="py-4">12</td>
                <td className="py-4">12</td>
                <td className="py-4"><Badge variant="success">Synced</Badge></td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
