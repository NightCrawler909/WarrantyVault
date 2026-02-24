'use client';

import { AddProductForm } from '@/components/products/AddProductForm';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function AddProductPage() {
  const router = useRouter();

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 mb-6 px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 hover:text-neutral-900 transition-all duration-200 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Products
        </button>
        <h1 className="text-3xl font-bold mb-6">Add New Product</h1>
        <AddProductForm />
      </div>
    </DashboardLayout>
  );
}
