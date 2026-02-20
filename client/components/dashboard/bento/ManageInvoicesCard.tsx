'use client';

import { motion } from 'framer-motion';
import { FileText, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export const ManageInvoicesCard: React.FC = () => {
  const router = useRouter();

  const handleClick = () => {
    router.push('/products');
  };

  return (
    <motion.button
      variants={item}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 shadow-sm shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-300 group cursor-pointer w-full h-full flex flex-col items-center justify-center min-h-[200px]"
    >
      {/* Icon */}
      <motion.div
        whileHover={{ rotate: 15 }}
        transition={{ duration: 0.3 }}
        className="p-4 bg-white/20 backdrop-blur-sm rounded-xl mb-4 group-hover:bg-white/30 transition-colors duration-300"
      >
        <div className="relative">
          <FileText className="w-8 h-8 text-white" strokeWidth={2.5} />
          <Upload className="w-4 h-4 text-white absolute -top-1 -right-1" strokeWidth={2.5} />
        </div>
      </motion.div>

      {/* Text */}
      <h3 className="text-lg font-semibold text-white mb-1">
        Manage Invoices
      </h3>
      <p className="text-sm text-white/80">
        Upload & view invoices
      </p>
    </motion.button>
  );
};
