'use client';

import { Card } from '@/components/ui/Card';
import { useProducts } from '@/hooks/useProducts';

export const ProductList = () => {
  const { products, isLoading } = useProducts();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products && products.length > 0 ? (
        products.map((product: any) => (
          <Card key={product._id}>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">{product.name}</h3>
              <p className="text-sm text-gray-600">{product.category}</p>
              <div className="border-t pt-3">
                <p className="text-sm">
                  <span className="text-gray-600">Purchase Date:</span>{' '}
                  {new Date(product.purchaseDate).toLocaleDateString()}
                </p>
                <p className="text-sm">
                  <span className="text-gray-600">Warranty Expires:</span>{' '}
                  {new Date(product.warrantyExpiry).toLocaleDateString()}
                </p>
              </div>
            </div>
          </Card>
        ))
      ) : (
        <p className="text-gray-500 col-span-full text-center py-8">No products found</p>
      )}
    </div>
  );
};
