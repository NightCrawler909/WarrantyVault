import { useState, useEffect } from 'react';
import { productService } from '@/services/productService';
import { ProductStats } from '@/types/product';

export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [expiringProducts, setExpiringProducts] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData, statsData, expiringData] = await Promise.all([
          productService.getAllProducts(),
          productService.getStats(),
          productService.getExpiringProducts(),
        ]);

        setProducts(productsData);
        setStats(statsData);
        setExpiringProducts(expiringData);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return { products, stats, expiringProducts, recentProducts, isLoading };
};
