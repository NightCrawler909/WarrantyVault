import { ProductList } from '@/components/products/ProductList';
import { ProductFilters } from '@/components/products/ProductFilters';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function ProductsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">My Products</h1>
          <Link href="/products/add">
            <Button variant="primary">Add Product</Button>
          </Link>
        </div>
        <ProductFilters />
        <ProductList />
      </div>
    </DashboardLayout>
  );
}
