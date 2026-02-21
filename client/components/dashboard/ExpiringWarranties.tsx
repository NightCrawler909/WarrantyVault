'use client';

import { Card } from '@/components/ui/Card';
import { useProducts } from '@/hooks/useProducts';

export const ExpiringWarranties = () => {
  const { expiringProducts } = useProducts();

  return (
    <Card>
      <h3 className="text-xl font-semibold mb-4">Expiring Soon</h3>
      <div className="space-y-3">
        {expiringProducts && expiringProducts.length > 0 ? (
          expiringProducts.map((product: any) => (
            <div key={product._id} className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
              <div>
                <p className="font-medium">{product.name}</p>
              </div>
              <p className="text-sm text-yellow-600 font-medium">
                {product.daysRemaining} days left
              </p>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center py-4">No warranties expiring soon</p>
        )}
      </div>
    </Card>
  );
};
