'use client';

import { motion } from 'framer-motion';
import { Clock, AlertCircle } from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  remainingDays?: number;
  warrantyExpiry: Date;
}

interface ExpiringSoonCardProps {
  products: Product[];
}

const getDaysRemaining = (expiryDate: Date): number => {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export const ExpiringSoonCard: React.FC<ExpiringSoonCardProps> = ({
  products,
}) => {
  // Get top 3 nearest expiry products
  const topExpiring = products
    .map(p => ({
      ...p,
      daysRemaining: p.remainingDays ?? getDaysRemaining(p.warrantyExpiry)
    }))
    .sort((a, b) => a.daysRemaining - b.daysRemaining)
    .slice(0, 3);

  return (
    <motion.div
      variants={item}
      className="bg-white rounded-2xl p-6 shadow-sm shadow-black/5 border border-neutral-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-out"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-orange-50 rounded-lg">
            <Clock className="w-4 h-4 text-orange-600" strokeWidth={2} />
          </div>
          <h3 className="text-lg font-medium text-neutral-900 tracking-tight">Expiring Soon</h3>
        </div>
      </div>

      {/* Products List */}
      {topExpiring.length === 0 ? (
        <div className="text-center py-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-neutral-50 rounded-full mb-3">
            <Clock className="w-6 h-6 text-neutral-400" />
          </div>
          <p className="text-sm text-neutral-500">No warranties expiring soon</p>
        </div>
      ) : (
        <div className="space-y-3">
          {topExpiring.map((product, index) => {
            const isUrgent = product.daysRemaining < 30;
            const isCritical = product.daysRemaining < 7;
            
            return (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 * index }}
                className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-colors duration-200"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {isCritical && (
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  )}
                  <p className="text-sm font-medium text-neutral-900 truncate">
                    {product.name}
                  </p>
                </div>
                <div className="ml-3 flex-shrink-0">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                      isCritical
                        ? 'bg-red-100 text-red-700'
                        : isUrgent
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-neutral-200 text-neutral-700'
                    }`}
                  >
                    {product.daysRemaining}d
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};
