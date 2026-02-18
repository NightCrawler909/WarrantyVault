'use client';

import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';

interface AnalyticsChartCardProps {
  active: number;
  expired: number;
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export const AnalyticsChartCard: React.FC<AnalyticsChartCardProps> = ({
  active,
  expired,
}) => {
  const data = [
    { name: 'Active', value: active },
    { name: 'Expired', value: expired },
  ];

  // Clean, minimal colors
  const COLORS = ['#2563eb', '#e5e7eb']; // blue-600, neutral-200

  const total = active + expired;

  return (
    <motion.div
      variants={item}
      className="bg-white rounded-2xl p-6 shadow-sm shadow-black/5 border border-neutral-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-out"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-50 rounded-lg">
            <PieChartIcon className="w-4 h-4 text-purple-600" strokeWidth={2} />
          </div>
          <h3 className="text-lg font-medium text-neutral-900 tracking-tight">Distribution</h3>
        </div>
      </div>

      {/* Chart */}
      <div className="relative mb-4">
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
              paddingAngle={4}
              dataKey="value"
              animationBegin={0}
              animationDuration={1000}
              animationEasing="ease-out"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Text */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
          <motion.p
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-2xl font-semibold text-neutral-900"
          >
            {total}
          </motion.p>
          <p className="text-xs text-neutral-500 mt-0.5">
            Total
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
          className="p-3 bg-blue-50 rounded-xl"
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-blue-600" />
            <span className="text-xs text-blue-900 font-medium">Active</span>
          </div>
          <p className="text-lg font-semibold text-blue-900">
            {active}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.7 }}
          className="p-3 bg-neutral-50 rounded-xl"
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-neutral-400" />
            <span className="text-xs text-neutral-600 font-medium">Expired</span>
          </div>
          <p className="text-lg font-semibold text-neutral-700">
            {expired}
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
};
