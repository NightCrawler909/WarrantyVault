'use client';

import { Package, ShieldCheck, Clock, XCircle } from 'lucide-react';
import { StatCard } from './StatCard';
import { useProducts } from '@/hooks/useProducts';

export const DashboardStats = () => {
  const { stats } = useProducts();

  const statCards = [
    {
      title: 'Total Products',
      value: stats?.total || 0,
      icon: Package,
      gradient: 'bg-gradient-to-br from-blue-500 to-blue-700',
      trend: { value: 12, isPositive: true },
      delay: 0,
    },
    {
      title: 'Active Warranties',
      value: stats?.active || 0,
      icon: ShieldCheck,
      gradient: 'bg-gradient-to-br from-green-500 to-emerald-700',
      trend: { value: 8, isPositive: true },
      delay: 0.1,
    },
    {
      title: 'Expiring in 30 Days',
      value: stats?.expiringSoon || 0,
      icon: Clock,
      gradient: 'bg-gradient-to-br from-orange-500 to-red-600',
      trend: { value: 5, isPositive: false },
      delay: 0.2,
    },
    {
      title: 'Expired Products',
      value: stats?.expired || 0,
      icon: XCircle,
      gradient: 'bg-gradient-to-br from-gray-500 to-gray-700',
      trend: { value: 3, isPositive: false },
      delay: 0.3,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat) => (
        <StatCard key={stat.title} {...stat} />
      ))}
    </div>
  );
};
