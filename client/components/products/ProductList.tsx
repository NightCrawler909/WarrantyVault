'use client';

import { motion } from 'framer-motion';
import { Package, Calendar, ArrowRight, Clock } from 'lucide-react';
import Link from 'next/link';

interface ProductListProps {
  products: any[];
  isLoading: boolean;
  searchQuery: string;
}

export const ProductList: React.FC<ProductListProps> = ({ products = [], isLoading, searchQuery = '' }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredProducts && filteredProducts.length > 0 ? (
        filteredProducts.map((product: any, index: number) => {
          const expirationDate = new Date(product.warrantyExpiry);
          const today = new Date();
          const timeDiff = expirationDate.getTime() - today.getTime();
          const daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24))); // Ensure non-negative

          const getStatusConfig = (status: string, days: number) => {
            if (days <= 0) return { color: 'text-red-700', bg: 'bg-red-50', label: 'Expired' };
            if (days <= 30) return { color: 'text-amber-700', bg: 'bg-amber-50', label: 'Expiring Soon' };
            return { color: 'text-emerald-700', bg: 'bg-emerald-50', label: 'Active' };
          };

          const statusConfig = getStatusConfig(product.status, daysRemaining);

          return (
            <motion.div
              key={product._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Link href={`/products/${product._id}`}>
                <div className="bg-white rounded-2xl p-6 shadow-sm shadow-black/5 border border-neutral-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer group h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <Package className="w-4 h-4 text-blue-600" strokeWidth={2} />
                        </div>
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${statusConfig.bg} ${statusConfig.color} flex items-center gap-1.5`}>
                          <Clock className="w-3 h-3" strokeWidth={2.5} />
                          {daysRemaining > 0 ? `${daysRemaining} days left` : 'Expired'}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-200" />
                    </div>

                    <h3 className="text-lg font-semibold text-neutral-900 mb-2 truncate">
                      {product.name}
                    </h3>
                  </div>

                  <div className="space-y-3 pt-4 mt-2 border-t border-neutral-100">
                    <div className="flex items-center justify-between text-xs text-neutral-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" strokeWidth={2} />
                        <span>Purchased</span>
                      </div>
                      <span className="font-medium text-neutral-700">
                        {new Date(product.purchaseDate).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-neutral-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" strokeWidth={2} />
                        <span>Expires</span>
                      </div>
                      <span className={`font-medium ${statusConfig.color === 'text-red-700' ? 'text-red-600' : 'text-neutral-700'}`}>
                        {new Date(product.warrantyExpiry).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Progress Bar Visual */}
                    {daysRemaining > 0 && (
                      <div className="mt-3 w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            daysRemaining < 30 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ 
                            width: `${Math.min(100, Math.max(5, (daysRemaining / 365) * 100))}%` 
                          }}
                        />
                      </div>
                    )}
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
