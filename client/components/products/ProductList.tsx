'use client';

import { useProducts } from '@/hooks/useProducts';
import { motion } from 'framer-motion';
import { Package, Calendar, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const ProductList = () => {
  const { products, isLoading } = useProducts();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products && products.length > 0 ? (
        products.map((product: any, index: number) => {
          const getStatusConfig = (status: string) => {
            switch (status) {
              case 'active':
                return { color: 'text-emerald-700', bg: 'bg-emerald-50', label: 'Active' };
              case 'expiring':
                return { color: 'text-amber-700', bg: 'bg-amber-50', label: 'Expiring' };
              case 'expired':
                return { color: 'text-red-700', bg: 'bg-red-50', label: 'Expired' };
              default:
                return { color: 'text-neutral-700', bg: 'bg-neutral-50', label: status };
            }
          };

          const statusConfig = getStatusConfig(product.status);

          return (
            <motion.div
              key={product._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Link href={`/products/${product._id}`}>
                <div className="bg-white rounded-2xl p-6 shadow-sm shadow-black/5 border border-neutral-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Package className="w-4 h-4 text-blue-600" strokeWidth={2} />
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-200" />
                  </div>

                  <h3 className="text-lg font-medium text-neutral-900 mb-4 truncate">
                    {product.name}
                  </h3>

                  <div className="space-y-2 border-t border-neutral-100 pt-4">
                    <div className="flex items-center gap-2 text-xs text-neutral-600">
                      <Calendar className="w-3.5 h-3.5" strokeWidth={2} />
                      <span>Purchased: {new Date(product.purchaseDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-neutral-600">
                      <Calendar className="w-3.5 h-3.5" strokeWidth={2} />
                      <span>Expires: {new Date(product.warrantyExpiry).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })
      ) : (
        <div className="col-span-full text-center py-12">
          <div className="p-4 bg-neutral-50 rounded-2xl inline-block mb-3">
            <Package className="w-8 h-8 text-neutral-400" strokeWidth={2} />
          </div>
          <p className="text-neutral-500 text-sm">No products found</p>
        </div>
      )}
    </div>
  );
};
