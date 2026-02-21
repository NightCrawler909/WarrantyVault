'use client';

import { motion } from 'framer-motion';
import { Calendar, Package, Clock } from 'lucide-react';
import { WarrantyProgressBar } from './WarrantyProgressBar';
import { formatDate, getDaysRemaining } from '@/utils/date';

interface Product {
  _id: string;
  name: string;
  warrantyExpiry: Date;
  warrantyPeriod: number;
  retailer?: string;
  purchaseDate: Date;
}

interface WarrantyTimelineProps {
  products: Product[];
}

export const WarrantyTimeline: React.FC<WarrantyTimelineProps> = ({ products }) => {
  // Sort products by nearest expiry
  const sortedProducts = [...products].sort((a, b) => {
    const daysA = getDaysRemaining(a.warrantyExpiry);
    const daysB = getDaysRemaining(b.warrantyExpiry);
    return daysA - daysB;
  });

  // Take only the top 5 for timeline
  const timelineProducts = sortedProducts.slice(0, 5);

  if (timelineProducts.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center">
        <Package className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          No Products Yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Add your first product to start tracking warranties
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
          <Clock className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Warranty Timeline
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Products sorted by expiration date
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {timelineProducts.map((product, index) => {
          const daysRemaining = getDaysRemaining(product.warrantyExpiry);
          const warrantyPeriodDays = product.warrantyPeriod * 30; // Convert months to days

          return (
            <motion.div
              key={product._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:shadow-md transition-shadow duration-300"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    {product.name}
                  </h3>
                  <div className="flex flex-wrap gap-2 text-sm text-gray-600 dark:text-gray-400">
                    {product.retailer && (
                      <span className="inline-flex items-center gap-1">
                        {product.retailer}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(product.warrantyExpiry)}
                  </div>
                </div>
              </div>

              <WarrantyProgressBar
                daysRemaining={daysRemaining}
                warrantyPeriod={warrantyPeriodDays}
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
