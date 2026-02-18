'use client';

import { motion } from 'framer-motion';

interface WarrantyProgressBarProps {
  daysRemaining: number;
  warrantyPeriod: number; // Total warranty period in days
}

export const WarrantyProgressBar: React.FC<WarrantyProgressBarProps> = ({
  daysRemaining,
  warrantyPeriod,
}) => {
  const usagePercentage = Math.max(0, Math.min(100, ((warrantyPeriod - daysRemaining) / warrantyPeriod) * 100));
  
  // Color based on remaining days
  const getColor = () => {
    if (daysRemaining < 0) return 'bg-gray-400';
    if (daysRemaining < 30) return 'bg-gradient-to-r from-red-500 to-red-600';
    if (daysRemaining < 90) return 'bg-gradient-to-r from-yellow-500 to-orange-500';
    return 'bg-gradient-to-r from-green-500 to-emerald-600';
  };

  const getStatusText = () => {
    if (daysRemaining < 0) return 'Expired';
    if (daysRemaining < 30) return 'Critical';
    if (daysRemaining < 90) return 'Warning';
    return 'Active';
  };

  const getStatusColor = () => {
    if (daysRemaining < 0) return 'text-gray-500';
    if (daysRemaining < 30) return 'text-red-600 dark:text-red-400';
    if (daysRemaining < 90) return 'text-orange-600 dark:text-orange-400';
    return 'text-green-600 dark:text-green-400';
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className={`font-semibold ${getStatusColor()}`}>
          {getStatusText()}
        </span>
        <span className="text-gray-600 dark:text-gray-400">
          {daysRemaining >= 0 ? `${daysRemaining} days left` : 'Expired'}
        </span>
      </div>
      
      <div className="relative w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${usagePercentage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={`h-full ${getColor()} rounded-full`}
        />
      </div>
      
      <div className="text-xs text-gray-500 dark:text-gray-400">
        {usagePercentage.toFixed(0)}% warranty used
      </div>
    </div>
  );
};
