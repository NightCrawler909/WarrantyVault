'use client';

import { motion } from 'framer-motion';
import { Package, TrendingUp } from 'lucide-react';

interface OverviewCardProps {
  total: number;
  active: number;
  expired: number;
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export const OverviewCard: React.FC<OverviewCardProps> = ({
  total,
  active,
  expired,
}) => {
  return (
    <motion.div
      variants={item}
      className="bg-white rounded-2xl p-6 shadow-sm shadow-black/5 border border-neutral-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-out col-span-1 md:col-span-2"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-neutral-500 tracking-wide mb-1.5">Total Products</p>
          <motion.h2
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-4xl font-semibold tracking-tight text-neutral-900"
          >
            {total}
          </motion.h2>
        </div>
        <div className="p-3 bg-blue-50 rounded-xl">
          <Package className="w-6 h-6 text-blue-600" strokeWidth={2} />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="p-4 bg-emerald-50 rounded-xl border border-emerald-100"
        >
          <p className="text-xs text-emerald-600 font-medium tracking-wide mb-1">Active</p>
          <p className="text-2xl font-semibold text-emerald-700">{active}</p>
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp className="w-3 h-3 text-emerald-600" />
            <span className="text-xs text-emerald-600">+12%</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="p-4 bg-neutral-50 rounded-xl border border-neutral-100"
        >
          <p className="text-xs text-neutral-600 font-medium tracking-wide mb-1">Expired</p>
          <p className="text-2xl font-semibold text-neutral-700">{expired}</p>
          <div className="flex items-center gap-1 mt-2">
            <span className="text-xs text-neutral-500">{((expired / total) * 100).toFixed(0)}% of total</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
