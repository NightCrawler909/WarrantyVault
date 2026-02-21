'use client';

import { Card } from '@/components/ui/Card';
import { useProducts } from '@/hooks/useProducts';
import Link from 'next/link';

export const RecentProducts = () => {
  const { recentProducts } = useProducts();

  return (
    <Card>
      <h3 className="text-xl font-semibold mb-4">Recent Products</h3>
      <div className="space-y-3">
        {recentProducts && recentProducts.length > 0 ? (
          recentProducts.map((product: any) => (
            <Link key={product._id} href={`/products/${product._id}`}>
              <div className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div>
                  <p className="font-medium">{product.name}</p>
                </div>
                <p className="text-sm text-gray-500">
                  {new Date(product.createdAt).toLocaleDateString()}
                </p>
              </div>
            </Link>
          ))
        ) : (
          <p className="text-gray-500 text-center py-4">No products yet</p>
        )}
      </div>
    </Card>
  );
};
