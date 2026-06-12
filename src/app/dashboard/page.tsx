/* eslint-disable @next/next/no-img-element */
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ArrowRight, RefreshCw, ShoppingCart, TrendingUp, Sparkles } from 'lucide-react';
import SyncButton from '@/components/dashboard/SyncButton';
import OptimizeButton from '@/components/dashboard/OptimizeButton';
import OAuthHandoff from '@/components/dashboard/OAuthHandoff';
import PushToEbayButton from '@/components/dashboard/PushToEbayButton';
import RefreshDashboardButton from '@/components/dashboard/RefreshDashboardButton';
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

  // We removed the empty state wall so the full dashboard renders immediately even with 0 listings

  return (
    <div className="grid grid-cols-12 gap-6 h-full auto-rows-min">
      
      {/* Top Stats Row (Bento Grid) */}
      <div className="col-span-12 lg:col-span-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col justify-center items-start shadow-xl relative overflow-hidden group hover:bg-white/10 hover:shadow-[0_0_40px_rgba(139,92,246,0.3)] transition-all duration-500 hover:-translate-y-1">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/40 transition-all duration-500"></div>
        <p className="text-sm font-semibold text-slate-400 mb-1">Total Products</p>
        <h3 className="text-4xl font-black text-white">{totalListings}</h3>
        <p className="text-xs text-slate-500 mt-2 flex items-center"><span className="text-emerald-400 mr-1">↑ 12%</span> from last week</p>
      </div>

      <div className="col-span-12 lg:col-span-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col justify-center items-start shadow-xl relative overflow-hidden group hover:bg-white/10 hover:shadow-[0_0_40px_rgba(6,182,212,0.3)] transition-all duration-500 hover:-translate-y-1">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-secondary/20 rounded-full blur-3xl group-hover:bg-secondary/40 transition-all duration-500"></div>
        <p className="text-sm font-semibold text-slate-400 mb-1">Optimized</p>
        <h3 className="text-4xl font-black text-white">{optimizedListings}</h3>
        <div className="w-full bg-white/10 h-1.5 rounded-full mt-3 overflow-hidden">
          <div className="bg-gradient-to-r from-secondary to-primary h-full rounded-full" style={{ width: `${totalListings > 0 ? (optimizedListings/totalListings)*100 : 0}%` }}></div>
        </div>
      </div>

      <div className="col-span-12 lg:col-span-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col justify-center items-start shadow-xl relative overflow-hidden group hover:bg-white/10 hover:shadow-[0_0_40px_rgba(192,38,211,0.3)] transition-all duration-500 hover:-translate-y-1">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-accent/20 rounded-full blur-3xl group-hover:bg-accent/40 transition-all duration-500"></div>
        <p className="text-sm font-semibold text-slate-400 mb-1">Avg SEO Score</p>
        <h3 className="text-4xl font-black text-white">{Math.round(avgSeoScore)}<span className="text-lg text-slate-500">/100</span></h3>
        <p className="text-xs text-slate-500 mt-2 flex items-center"><span className="text-emerald-400 mr-1">↑ 8 pts</span> after optimization</p>
      </div>
      
      <div className="col-span-12 lg:col-span-3 bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-xl border border-primary/30 rounded-3xl p-6 flex flex-col justify-between items-start shadow-[0_0_30px_rgba(139,92,246,0.15)] hover:shadow-[0_0_50px_rgba(139,92,246,0.4)] relative overflow-hidden transition-all duration-500 hover:-translate-y-1">
        <div className="relative z-10 w-full flex justify-between items-start">
          <div>
            <p className="text-sm font-semibold text-white/80 mb-1">AI Engine</p>
            <h3 className="text-2xl font-bold text-white mb-2">Ready</h3>
          </div>
          <RefreshDashboardButton />
        </div>
        <div className="relative z-10 w-full mt-4">
          {totalListings - optimizedListings > 0 ? (
            <OptimizeButton count={totalListings - optimizedListings} />
          ) : (
            <button disabled className="w-full py-2.5 rounded-xl bg-white/10 text-white/50 font-semibold text-sm border border-white/5">
              All listings optimized
            </button>
          )}
        </div>
      </div>

      {/* Main Table Area (Bento Component) */}
      <div className="col-span-12 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-xl flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Inventory Optimization</h2>
            <p className="text-sm text-slate-400 mt-1">Manage and optimize your listings using Claude 3.5 Sonnet.</p>
          </div>
          <div className="flex space-x-3">
            <SyncButton />
          </div>
        </div>

        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-400">
                <th className="pb-4 font-semibold">Product</th>
                <th className="pb-4 font-semibold">Original Data</th>
                <th className="pb-4 font-semibold">AI Optimized Data</th>
                <th className="pb-4 font-semibold text-center">SEO Score</th>
                <th className="pb-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {listings?.map((listing) => (
                <tr key={listing.id} className="hover:bg-white/5 transition-colors group">
                  <td className="py-4 align-top">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-xl bg-black/50 border border-white/10 flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {listing.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={listing.image_url} alt="Product" className="w-full h-full object-cover" />
                        ) : (
                          <ShoppingCart className="w-5 h-5 text-slate-500" />
                        )}
                      </div>
                      <div className="text-xs font-mono text-slate-500">
                        {listing.external_product_id}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 align-top max-w-[200px] pr-4">
                    <p className="font-semibold text-sm text-slate-300 mb-1 line-clamp-2">{listing.original_title}</p>
                    <p className="text-xs text-slate-500 line-clamp-2">{listing.original_description?.replace(/<[^>]*>?/gm, '')}</p>
                  </td>
                  <td className="py-4 align-top max-w-[250px] pr-4">
                    {listing.optimization_status === 'pending' && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        Waiting for AI...
                      </span>
                    )}
                    {listing.optimization_status === 'processing' && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary border border-secondary/20">
                        <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Analyzing
                      </span>
                    )}
                    {listing.optimization_status === 'optimized' ? (
                      <div>
                        <p className="font-bold text-sm mb-1 text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">{listing.optimized_title}</p>
                        <p className="text-xs text-slate-400 line-clamp-2">
                          {listing.optimized_description?.replace(/<[^>]*>?/gm, '')}
                        </p>
                      </div>
                    ) : null}
                    {listing.optimization_status === 'failed' && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                        AI Failed
                      </span>
                    )}
                  </td>
                  <td className="py-4 align-top text-center">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-black/40 text-sm font-bold text-white shadow-inner">
                      {listing.seo_score || '-'}
                    </div>
                  </td>
                  <td className="py-4 align-top text-right">
                    {listing.optimization_status === 'optimized' ? (
                      <PushToEbayButton 
                        listingId={listing.external_product_id} 
                        title={listing.optimized_title} 
                        description={listing.optimized_description} 
                      />
                    ) : (
                      <button className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/5 text-white border border-white/10 hover:bg-white/10 transition-colors">
                        View
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              
              {(!listings || listings.length === 0) && (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 border border-white/10">
                        <ShoppingCart className="w-8 h-8 text-slate-500" />
                      </div>
                      <p className="text-slate-400 font-medium">No listings found.</p>
                      <p className="text-sm text-slate-500 mt-1 mb-4">Sync your store to get started.</p>
                      <SyncButton />
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
