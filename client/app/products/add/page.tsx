import { AddProductForm } from '@/components/products/AddProductForm';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function AddProductPage() {
  return (
    <DashboardLayout>
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">Add New Product</h1>
        <AddProductForm />
      </div>
    </DashboardLayout>
  );
}
