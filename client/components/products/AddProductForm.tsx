'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { productService } from '@/services/productService';

export const AddProductForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    purchaseDate: '',
    warrantyPeriod: '',
    price: '',
    retailer: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await productService.createProduct(formData);
      router.push('/products');
    } catch (error) {
      console.error('Failed to add product:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Product Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        
        <Input
          label="Category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
        />
        
        <Input
          label="Purchase Date"
          name="purchaseDate"
          type="date"
          value={formData.purchaseDate}
          onChange={handleChange}
          required
        />
        
        <Input
          label="Warranty Period (months)"
          name="warrantyPeriod"
          type="number"
          value={formData.warrantyPeriod}
          onChange={handleChange}
          required
        />
        
        <Input
          label="Price"
          name="price"
          type="number"
          value={formData.price}
          onChange={handleChange}
        />
        
        <Input
          label="Retailer"
          name="retailer"
          value={formData.retailer}
          onChange={handleChange}
        />

        <div className="flex gap-4">
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Add Product
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
};
