'use client';

import { useProducts } from '@/hooks/useProducts';
import { useState, useEffect } from 'react';
import { productService } from '@/services/productService';
import { ProductAnalytics } from '@/types/product';
import { motion } from 'framer-motion';
import {
  OverviewCard,
  ExpiringSoonCard,
  WarrantyTimelineCard,
  AnalyticsChartCard,
  QuickAddCard,
  WarrantyHealthCard,
  ManageInvoicesCard,
} from '@/components/dashboard/bento';
import { SmartAlertBanner } from '@/components/dashboard/SmartAlertBanner';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const DashboardContent = () => {
  const { products, stats, expiringProducts, isLoading } = useProducts();
  const [analytics, setAnalytics] = useState<ProductAnalytics | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await productService.getAnalytics();
        setAnalytics(data);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      }
    };

    if (!isLoading) {
      fetchAnalytics();
    }
  }, [isLoading]);

  if (isLoading || !analytics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Subtle Background Depth */}
      <div className="fixed inset-0 bg-gradient-to-br from-white via-[#f5f7fa] to-[#eef2f7] -z-10" />
      <div className="fixed top-0 right-0 w-96 h-96 bg-blue-300 rounded-full blur-3xl opacity-20 -z-10" />
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="max-w-7xl mx-auto px-8 py-10"
      >
        {/* Header */}
        <div className="mb-6">
          <p className="text-sm text-neutral-500 tracking-wide mb-1">Welcome back</p>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
            Warranty Overview
          </h1>
        </div>

        {/* Smart Alert Banner */}
        <div className="mb-6">
          <SmartAlertBanner
            urgentCount={analytics.urgentExpiring.length}
            upcomingCount={analytics.upcomingExpiring.length}
          />
        </div>

        {/* Main Grid Layout */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {/* Overview Card - Spans 2 columns */}
          <OverviewCard
            total={analytics.totalProducts}
            active={analytics.activeCount}
            expired={analytics.expiredCount}
          />

          {/* Expiring Soon Card */}
          <ExpiringSoonCard products={expiringProducts || []} />

          {/* Warranty Health Card */}
          <WarrantyHealthCard healthScore={analytics.healthScore} />

          {/* Analytics Chart Card */}
          <AnalyticsChartCard
            active={analytics.activeCount}
            expired={analytics.expiredCount}
          />

          {/* Warranty Timeline Card - Full Width */}
          <WarrantyTimelineCard products={products || []} />

          {/* Quick Add Card */}
          <QuickAddCard />

          {/* Manage Invoices Card */}
          <ManageInvoicesCard />
        </motion.div>
      </motion.div>
    </div>
  );
};
