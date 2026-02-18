'use client';

import { Input } from '@/components/ui/Input';

export const ProductFilters = () => {
  return (
    <div className="flex gap-4 items-center">
      <Input
        placeholder="Search products..."
        className="max-w-md"
      />
      <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
        <option value="">All Categories</option>
        <option value="electronics">Electronics</option>
        <option value="appliances">Appliances</option>
        <option value="furniture">Furniture</option>
      </select>
    </div>
  );
};
