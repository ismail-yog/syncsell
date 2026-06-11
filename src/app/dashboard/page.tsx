/* eslint-disable @next/next/no-img-element */
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ArrowRight, RefreshCw, ShoppingCart, TrendingUp, Sparkles } from 'lucide-react';
import SyncButton from '@/components/dashboard/SyncButton';
import OptimizeButton from '@/components/dashboard/OptimizeButton';
import OAuthHandoff from '@/components/dashboard/OAuthHandoff';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const errorParam = searchParams.error as string;
  // No more handoff needed!

  // Fetch Store Credentials
  const { data: store } = await supabase
    .from('store_credentials')
    .select('*')
    .eq('user_id', user.id)
    .eq('platform', 'ebay')
    .single();

  // Fetch Listings
  const { data: listings } = await supabase
    .from('product_listings')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const totalListings = listings?.length || 0;
  const optimizedListings = listings?.filter(l => l.optimization_status === 'optimized').length || 0;
  const avgSeoScore = totalListings > 0 
    ? Math.round((listings!.reduce((acc, curr) => acc + (curr.seo_score || 0), 0)) / totalListings)
    : 0;

  if (!store) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        {errorParam && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl mb-8 max-w-xl w-full text-left">
            <h3 className="font-bold mb-1 flex items-center"><span className="mr-2">⚠️</span> Authentication Error</h3>
            <p className="text-sm font-mono break-all">{errorParam}</p>
            <p className="text-xs mt-2 opacity-80">This means your environment variables or Supabase database might not be configured correctly. Please share this exact error with your developer.</p>
          </div>
        )}
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <ShoppingCart className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Connect Your Store</h1>
        <p className="text-muted-foreground text-lg max-w-xl mb-8">
          Link your eBay account to instantly import your products and let Claude 3.5 Sonnet rewrite them for maximum SEO visibility.
        </p>
        <a 
          href="/api/ebay/auth"
          className="px-8 py-4 rounded-xl bg-primary text-white font-semibold text-lg hover:scale-[1.02] transition-all glow-primary flex items-center space-x-2"
        >
          <span>Connect eBay Account</span>
          <ArrowRight className="w-5 h-5" />
        </a>
      </div>
    );
  }

  if (totalListings === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mb-6">
          <RefreshCw className="w-10 h-10 text-secondary" />
        </div>
        <h1 className="text-4xl font-bold mb-4">eBay Connected!</h1>
        <p className="text-muted-foreground text-lg max-w-xl mb-8">
          Your store is securely linked. Click below to synchronize your active listings into the dashboard so we can begin optimization.
        </p>
        <SyncButton />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* STATS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl flex items-center space-x-4">
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Listings</p>
            <p className="text-2xl font-bold">{totalListings}</p>
          </div>
        </div>
        <div className="glass-card p-6 rounded-2xl flex items-center space-x-4">
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Optimized by AI</p>
            <p className="text-2xl font-bold">{optimizedListings}</p>
          </div>
        </div>
        <div className="glass-card p-6 rounded-2xl flex items-center space-x-4">
          <div className="p-3 bg-green-500/10 text-green-500 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Average SEO Score</p>
            <p className="text-2xl font-bold">{avgSeoScore}/100</p>
          </div>
        </div>
      </div>

      {/* BEFORE / AFTER TABLE */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-border/50 flex justify-between items-center bg-white/50">
          <h2 className="text-xl font-bold">Listing Optimization</h2>
          <div className="flex space-x-3">
            <SyncButton variant="secondary" />
            <OptimizeButton count={totalListings - optimizedListings} />
          </div>
        </div>
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border/50">
                <th className="p-4 font-medium text-sm text-muted-foreground">Product</th>
                <th className="p-4 font-medium text-sm text-muted-foreground">Original (Before)</th>
                <th className="p-4 font-medium text-sm text-muted-foreground">Optimized (After)</th>
                <th className="p-4 font-medium text-sm text-muted-foreground text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {listings?.map((listing) => (
                <tr key={listing.id} className="hover:bg-muted/20 transition-colors">
                  <td className="p-4 align-top w-1/5">
                    {listing.image_url ? (
                      <img src={listing.image_url} alt="Product" className="w-16 h-16 rounded-lg object-cover mb-2 border" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-muted mb-2 border flex items-center justify-center text-xs text-muted-foreground">No Img</div>
                    )}
                    <span className="text-xs font-medium px-2 py-1 bg-muted rounded-full text-muted-foreground block w-max">
                      ID: {listing.external_product_id}
                    </span>
                  </td>
                  <td className="p-4 align-top w-2/5">
                    <p className="font-medium text-sm mb-1">{listing.original_title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-3">
                      {listing.original_description?.replace(/<[^>]*>?/gm, '') || 'No description'}
                    </p>
                  </td>
                  <td className="p-4 align-top w-2/5 relative">
                    {listing.optimization_status === 'optimized' ? (
                      <div>
                        <p className="font-medium text-sm mb-1 text-primary">{listing.optimized_title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-3">
                          {listing.optimized_description?.replace(/<[^>]*>?/gm, '')}
                        </p>
                      </div>
                    ) : listing.optimization_status === 'processing' ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm">
                        <span className="text-sm font-medium text-primary animate-pulse">Optimizing...</span>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground italic mt-2">Waiting for optimization...</div>
                    )}
                  </td>
                  <td className="p-4 align-top text-center">
                    {listing.optimization_status === 'optimized' ? (
                      <div className="inline-flex flex-col items-center">
                        <span className="w-10 h-10 rounded-full border-4 border-green-500/20 text-green-600 font-bold flex items-center justify-center mb-1">
                          {listing.seo_score}
                        </span>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-green-600">Score</span>
                      </div>
                    ) : (
                      <span className="inline-block px-2 py-1 text-xs rounded-full bg-yellow-500/10 text-yellow-600 font-medium">
                        Pending
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
