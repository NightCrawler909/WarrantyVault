'use client';

import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

interface WarrantyHealthCardProps {
  healthScore: number;
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export const WarrantyHealthCard: React.FC<WarrantyHealthCardProps> = ({
  healthScore,
}) => {
  // Determine color based on health score
  const getHealthConfig = () => {
    if (healthScore >= 80) {
      return {
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        strokeColor: '#10b981', // emerald-500
        status: 'Excellent',
        statusColor: 'text-emerald-700',
      };
    }
    
    if (healthScore >= 50) {
      return {
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        strokeColor: '#f59e0b', // amber-500
        status: 'Fair',
        statusColor: 'text-amber-700',
      };
    }

    return {
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      strokeColor: '#ef4444', // red-500
      status: 'Needs Attention',
      statusColor: 'text-red-700',
    };
  };

  const config = getHealthConfig();
  
  // Circle configuration
  const size = 120;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (healthScore / 100) * circumference;

  return (
    <motion.div
      variants={item}
      className="bg-white rounded-2xl p-6 shadow-sm shadow-black/5 border border-neutral-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-out"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className={`p-2 ${config.bgColor} rounded-lg`}>
            <Heart className={`w-4 h-4 ${config.color}`} strokeWidth={2} fill="currentColor" />
          </div>
          <h3 className="text-lg font-medium text-neutral-900 tracking-tight">Warranty Health</h3>
        </div>
      </div>

      {/* Circular Progress Ring */}
      <div className="flex flex-col items-center justify-center">
        <div className="relative" style={{ width: size, height: size }}>
          {/* Background Circle */}
          <svg className="transform -rotate-90" width={size} height={size}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#e5e7eb"
              strokeWidth={strokeWidth}
              fill="none"
            />
            {/* Progress Circle */}
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={config.strokeColor}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.5, ease: 'easeOut', delay: 0.2 }}
              style={{
                strokeDasharray: circumference,
              }}
            />
          </svg>

          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.p
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className={`text-3xl font-semibold ${config.color}`}
            >
              {healthScore}
            </motion.p>
            <p className="text-xs text-neutral-500 mt-0.5">out of 100</p>
          </div>
        </div>

        {/* Status Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.7 }}
          className={`mt-4 px-3 py-1.5 ${config.bgColor} rounded-full`}
        >
          <p className={`text-xs font-medium ${config.statusColor}`}>
            {config.status}
          </p>
        </motion.div>

        {/* Description */}
        <p className="text-xs text-neutral-500 text-center mt-3 tracking-wide">
          Based on expiring and expired warranties
        </p>
      </div>
    </motion.div>
  );
};
