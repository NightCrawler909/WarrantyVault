'use client';

import { ProductList } from '@/components/products/ProductList';
import { ProductFilters } from '@/components/products/ProductFilters';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { useState } from 'react';
import { useProducts } from '@/hooks/useProducts';

export default function ProductsPage() {
  const { products, isLoading } = useProducts();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <DashboardLayout>
      <div className="space-y-6 p-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">My Products</h1>
          <Link href="/products/add">
            <Button variant="primary">Add Product</Button>
          </Link>
        </div>
        <ProductFilters 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery} 
          products={products} 
        />
        <ProductList 
          products={products} 
          isLoading={isLoading} 
          searchQuery={searchQuery} 
        />
      </div>
    </DashboardLayout>
  );
}
