'use client';

import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export const QuickAddCard: React.FC = () => {
  const router = useRouter();

  const handleClick = () => {
    router.push('/products/add');
  };

  return (
    <motion.button
      variants={item}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-sm shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 group cursor-pointer w-full h-full flex flex-col items-center justify-center min-h-[200px]"
    >
      {/* Plus Icon */}
      <motion.div
        whileHover={{ rotate: 90 }}
        transition={{ duration: 0.3 }}
        className="p-4 bg-white/20 backdrop-blur-sm rounded-xl mb-4 group-hover:bg-white/30 transition-colors duration-300"
      >
        <Plus className="w-8 h-8 text-white" strokeWidth={2.5} />
      </motion.div>

      {/* Text */}
      <h3 className="text-lg font-semibold text-white mb-1">
        Add Product
      </h3>
      <p className="text-sm text-white/80">
        Quick add warranty
      </p>
    </motion.button>
  );
};
