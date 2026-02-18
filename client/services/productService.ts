import apiClient from '@/lib/apiClient';

export const productService = {
  async getAllProducts() {
    const response = await apiClient.get('/products');
    return response.data.data; // Extract nested data
  },

  async getProductById(id: string) {
    const response = await apiClient.get(`/products/${id}`);
    return response.data.data;
  },

  async createProduct(productData: any) {
    const response = await apiClient.post('/products', productData);
    return response.data.data;
  },

  async updateProduct(id: string, productData: any) {
    const response = await apiClient.put(`/products/${id}`, productData);
    return response.data.data;
  },

  async deleteProduct(id: string) {
    const response = await apiClient.delete(`/products/${id}`);
    return response.data.data;
  },

  async getStats() {
    const response = await apiClient.get('/products/stats');
    const data = response.data.data;
    
    // Map backend property names to frontend expectations
    return {
      total: data.totalProducts,
      active: data.activeCount,
      expiringSoon: data.expiringCount,
      expired: data.expiredCount,
    };
  },

  async getExpiringProducts() {
    const response = await apiClient.get('/products/expiring');
    return response.data.data; // Extract nested data
  },

  async getRecentProducts() {
    const response = await apiClient.get('/products/recent');
    return response.data.data;
  },

  async uploadInvoice(productId: string, file: File) {
    const formData = new FormData();
    formData.append('invoice', file);
    const response = await apiClient.post(`/products/${productId}/invoice`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },
};
