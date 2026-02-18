'use client';

import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface SmartAlertBannerProps {
  urgentCount: number;
  upcomingCount: number;
}

export const SmartAlertBanner: React.FC<SmartAlertBannerProps> = ({
  urgentCount,
  upcomingCount,
}) => {
  // Determine banner type based on priority
  const getBannerConfig = () => {
    if (urgentCount > 0) {
      return {
        type: 'urgent',
        icon: AlertCircle,
        bgColor: 'bg-red-50',
        borderColor: 'border-red-100',
        iconColor: 'text-red-600',
        textColor: 'text-red-900',
        iconBg: 'bg-red-100',
        message: `⚠️ ${urgentCount} ${urgentCount === 1 ? 'warranty' : 'warranties'} expiring within 7 days`,
      };
    }
    
    if (upcomingCount > 0) {
      return {
        type: 'upcoming',
        icon: Clock,
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-100',
        iconColor: 'text-amber-600',
        textColor: 'text-amber-900',
        iconBg: 'bg-amber-100',
        message: `⏰ ${upcomingCount} ${upcomingCount === 1 ? 'warranty' : 'warranties'} expiring within 30 days`,
      };
    }

    return {
      type: 'healthy',
      icon: CheckCircle,
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
      iconColor: 'text-emerald-600',
      textColor: 'text-emerald-900',
      iconBg: 'bg-emerald-100',
      message: '✓ All warranties healthy',
    };
  };

  const config = getBannerConfig();
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`${config.bgColor} ${config.borderColor} border rounded-xl p-4 flex items-center gap-3`}
    >
      <div className={`${config.iconBg} p-2 rounded-lg flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${config.iconColor}`} strokeWidth={2} />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${config.textColor}`}>
          {config.message}
        </p>
      </div>
    </motion.div>
  );
};
