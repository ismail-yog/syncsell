'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export interface ProductListing {
  id: string;
  originalTitle: string;
  optimizedTitle: string;
  originalDescription: string;
  optimizedDescription: string;
  originalCategory: string;
  mappedCategory: string;
  itemSpecifics: string[];
  seoScore: number;
  platform: 'shopify' | 'ebay';
}

interface BeforeAfterCardProps {
  product: ProductListing;
  onPushLive: () => void;
  isLoading: boolean;
}

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const childVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

function getSeoBarColor(score: number): string | undefined {
  if (score < 50) return 'bg-danger';
  if (score < 75) return 'bg-warning';
  if (score < 90) return 'bg-success';
  return undefined; // 90+ uses inline gradient
}

export default function BeforeAfterCard({
  product,
  onPushLive,
  isLoading,
}: BeforeAfterCardProps) {
  const seoBarClass = getSeoBarColor(product.seoScore);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="bg-surface border border-border rounded-2xl overflow-hidden"
    >
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 md:grid-cols-2"
      >
        {/* LEFT — Before */}
        <motion.div variants={childVariants} className="p-6 bg-surface-alt/50">
          <Badge variant="neutral">BEFORE</Badge>

          <p className="line-through text-text-muted mt-3 font-medium">
            {product.originalTitle}
          </p>

          <p className="text-text-muted text-sm mt-2 line-clamp-3">
            {product.originalDescription}
          </p>

          <span className="inline-block bg-surface-alt text-text-muted text-xs px-2 py-1 rounded-lg mt-3">
            {product.originalCategory}
          </span>
        </motion.div>

        {/* RIGHT — After */}
        <motion.div
          variants={childVariants}
          className="p-6 md:border-l border-border"
        >
          <Badge variant="success" dot>
            AFTER
          </Badge>

          <p className="font-semibold text-primary mt-3">
            {product.optimizedTitle}
          </p>

          <p className="text-sm mt-2 line-clamp-3">
            {product.optimizedDescription}
          </p>

          <span className="inline-block bg-primary/10 text-primary text-xs px-2 py-1 rounded-lg mt-3">
            {product.mappedCategory}
          </span>

          {product.itemSpecifics.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {product.itemSpecifics.map((spec) => (
                <span
                  key={spec}
                  className="bg-accent/10 text-accent text-xs px-2 py-0.5 rounded-full"
                >
                  {spec}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* BOTTOM */}
      <motion.div
        variants={childVariants}
        className="px-6 py-4 border-t border-border flex items-center justify-between flex-wrap gap-4"
      >
        {/* SEO Score */}
        <div className="flex items-center gap-3">
          <div>
            <span className="text-sm text-text-muted">SEO Score </span>
            <span className="font-bold">{product.seoScore}</span>
          </div>
          <div className="h-2 w-32 sm:w-48 bg-surface-alt rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-1000',
                seoBarClass
              )}
              style={{
                width: `${product.seoScore}%`,
                ...(product.seoScore >= 90
                  ? {
                      background:
                        'linear-gradient(90deg, var(--color-primary), var(--color-accent))',
                    }
                  : {}),
              }}
            />
          </div>
        </div>

        {/* Platform badge + Push Live */}
        <div className="flex items-center gap-3">
          {/* Platform */}
          <span
            className={cn(
              'text-xs font-medium px-3 py-1 rounded-full',
              product.platform === 'shopify'
                ? 'bg-emerald-500/10 text-emerald-500'
                : 'bg-blue-500/10 text-blue-500'
            )}
          >
            {product.platform === 'shopify' ? 'Shopify' : 'eBay'}
          </span>

          {/* Push Live */}
          <Button
            variant="primary"
            size="sm"
            isLoading={isLoading}
            onClick={onPushLive}
          >
            Push Live
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
