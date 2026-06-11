'use client'
import { Layers } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

export default function MappingPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="w-8 h-8 text-warning" />
            <h1 className="text-3xl font-heading font-bold">AI Category Mapping</h1>
          </div>
          <p className="text-text-muted">Auto-fill eBay Item Specifics and Shopify metafields</p>
        </div>
        <Button variant="primary">Auto-Map All</Button>
      </div>

      <Card padding="md">
        <div className="flex justify-between items-center border-b border-border pb-4 mb-4">
          <h3 className="font-bold text-lg">Needs Attention (15)</h3>
        </div>
        <div className="space-y-4">
           <div className="p-4 border border-border rounded-lg bg-surface-alt">
             <div className="flex justify-between items-center mb-4">
               <div>
                 <h4 className="font-medium">Nike Air Max 90</h4>
                 <p className="text-sm text-text-muted">Category: Clothing, Shoes & Accessories</p>
               </div>
               <Badge variant="warning">Missing Specifics</Badge>
             </div>
             <div className="grid grid-cols-2 gap-4 text-sm">
               <div>
                 <p className="font-medium text-text-muted mb-2">Current Specifics</p>
                 <div className="space-y-1">
                   <p>Brand: Nike</p>
                 </div>
               </div>
               <div>
                 <p className="font-medium text-primary mb-2">AI Suggestions</p>
                 <div className="space-y-1 bg-primary/10 p-2 rounded">
                   <p>Model: Air Max 90</p>
                   <p>Style: Sneaker</p>
                   <p>Department: Men</p>
                   <p>Type: Athletic</p>
                 </div>
                 <div className="mt-3 flex space-x-2">
                   <Button variant="primary" size="sm">Accept All</Button>
                   <Button variant="outline" size="sm">Reject</Button>
                 </div>
               </div>
             </div>
           </div>
        </div>
      </Card>
    </div>
  )
}
