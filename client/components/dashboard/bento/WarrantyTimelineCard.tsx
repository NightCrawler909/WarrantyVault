'use client';

import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  category: string;
  warrantyExpiry: Date;
  warrantyPeriod: number;
  purchaseDate: Date;
  remainingDays?: number;
  warrantyUsagePercent?: number;
}

interface WarrantyTimelineCardProps {
  products: Product[];
}

const getDaysRemaining = (expiryDate: Date): number => {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const calculateUsagePercent = (
  purchaseDate: Date,
  warrantyExpiry: Date
): number => {
  const now = new Date();
  const start = new Date(purchaseDate);
  const end = new Date(warrantyExpiry);
  
  const totalDuration = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  
  const percent = (elapsed / totalDuration) * 100;
  return Math.max(0, Math.min(100, Math.round(percent)));
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export const WarrantyTimelineCard: React.FC<WarrantyTimelineCardProps> = ({
  products,
}) => {
  // Get top 5 products sorted by expiry
  const topProducts = products
    .map(p => ({
      ...p,
      daysRemaining: p.remainingDays ?? getDaysRemaining(p.warrantyExpiry),
      usagePercent: p.warrantyUsagePercent ?? calculateUsagePercent(p.purchaseDate, p.warrantyExpiry)
    }))
    .sort((a, b) => a.daysRemaining - b.daysRemaining)
    .slice(0, 5);

  const getStatusColor = (daysRemaining: number) => {
    if (daysRemaining < 0) return 'bg-red-500';
    if (daysRemaining <= 30) return 'bg-orange-500';
    return 'bg-emerald-500';
  };

  const getStatusBgColor = (daysRemaining: number) => {
    if (daysRemaining < 0) return 'bg-red-50';
    if (daysRemaining <= 30) return 'bg-orange-50';
    return 'bg-emerald-50';
  };

  return (
    <motion.div
      variants={item}
      className="bg-white rounded-2xl p-6 shadow-sm shadow-black/5 border border-neutral-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-out col-span-1 md:col-span-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Activity className="w-4 h-4 text-blue-600" strokeWidth={2} />
          </div>
          <h3 className="text-lg font-medium text-neutral-900 tracking-tight">Warranty Timeline</h3>
        </div>
        <span className="text-xs text-neutral-500 tracking-wide">{topProducts.length} products</span>
      </div>

      {/* Timeline List */}
      {topProducts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-neutral-500">No products to display</p>
        </div>
      ) : (
        <div className="space-y-3">
          {topProducts.map((product, index) => (
            <motion.div
              key={product._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.05 * index }}
              className="group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(product.daysRemaining)} flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-neutral-500">{product.category}</p>
                  </div>
                </div>
                <div className="ml-4 text-right flex-shrink-0">
                  <p className="text-xs font-medium text-neutral-900">
                    {product.daysRemaining >= 0 ? `${product.daysRemaining}d left` : 'Expired'}
                  </p>
                  <p className="text-xs text-neutral-500">{product.usagePercent}% used</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className={`relative h-2 bg-neutral-200 rounded-full overflow-hidden`}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${product.usagePercent}%` }}
                  transition={{ duration: 1, delay: 0.2 + 0.05 * index, ease: 'easeOut' }}
                  className={`h-full ${getStatusColor(product.daysRemaining)} rounded-full`}
                />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};
