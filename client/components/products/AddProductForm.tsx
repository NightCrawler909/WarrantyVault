'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { productService } from '@/services/productService';
import { Sparkles, FileText, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import apiClient from '@/lib/apiClient';

export const AddProductForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    purchaseDate: '',
    warrantyPeriod: '',
    price: '',
    retailer: '',
    serialNumber: '',
    notes: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await productService.createProduct(formData);
      toast.success('Product added successfully!');
      router.push('/products');
    } catch (error) {
      console.error('Failed to add product:', error);
      toast.error('Failed to add product');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleInvoiceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type - PDF only
    const allowedTypes = ['application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PDF file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setInvoiceFile(file);
    toast.success('PDF uploaded! Click "Extract Data" to auto-fill form.');
  };

  const handleExtractData = async () => {
    if (!invoiceFile) {
      toast.error('Please upload an invoice first');
      return;
    }

    setIsExtracting(true);

    try {
      // Create FormData for upload
      const formDataUpload = new FormData();
      formDataUpload.append('invoice', invoiceFile);

      // Upload to temporary endpoint that extracts without product ID
      const response = await apiClient.post('/products/extract-temp-invoice', formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = response.data.data;

      // Auto-fill form
      const updates: any = {};
      if (data.detectedProductName) updates.name = data.detectedProductName;
      if (data.detectedVendor) updates.retailer = data.detectedVendor;
      if (data.detectedPurchaseDate) updates.purchaseDate = data.detectedPurchaseDate;
      if (data.detectedAmount) updates.price = data.detectedAmount.toString();
      if (data.detectedOrderId) updates.serialNumber = data.detectedOrderId;

      // Add HSN/FSN to notes
      let additionalInfo = [];
      if (data.detectedHSN) additionalInfo.push(`HSN/SAC: ${data.detectedHSN}`);
      if (data.detectedFSN) additionalInfo.push(`FSN: ${data.detectedFSN}`);
      if (additionalInfo.length > 0) {
        updates.notes = additionalInfo.join('\n');
      }

      setFormData((prev) => ({ ...prev, ...updates }));
      toast.success('Data extracted! Review and submit the form.');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to extract invoice data';
      toast.error(message, { duration: 4000 });
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Card - Manual Entry Form */}
      <Card>
        <h2 className="text-xl font-semibold text-neutral-900 mb-6">Product Details</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Product Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="e.g., Electric Kettle, Laptop"
          />
          
          <Input
            label="Purchase Date"
            name="purchaseDate"
            type="date"
            value={formData.purchaseDate}
            onChange={handleChange}
            required
          />
          
          <div>
            <Input
              label="Warranty Period (months)"
              name="warrantyPeriod"
              type="number"
              value={formData.warrantyPeriod}
              onChange={handleChange}
              required
              min="1"
            />
            <p className="text-xs text-neutral-500 mt-1">
              Common periods: 6, 12, 24, 36 months
            </p>
          </div>
          
          <Input
            label="Price"
            name="price"
            type="number"
            value={formData.price}
            onChange={handleChange}
            placeholder="0.00"
          />
          
          <Input
            label="Retailer"
            name="retailer"
            value={formData.retailer}
            onChange={handleChange}
            placeholder="e.g., Amazon, Flipkart"
          />

          <Input
            label="Serial Number / Order ID"
            name="serialNumber"
            value={formData.serialNumber}
            onChange={handleChange}
            placeholder="From invoice or product label"
          />

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Notes (HSN, FSN, warranty details, etc.)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Additional information for warranty claims..."
            />
          </div>

          <div className="flex gap-4 pt-2">
            <Button type="submit" variant="primary" isLoading={isLoading}>
              Add Product
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>

      {/* Right Card - Invoice Upload with Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-600 p-[1px]">
        <div className="bg-white rounded-2xl p-6 h-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl">
              <Sparkles className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">Smart Auto-Fill</h2>
              <p className="text-sm text-neutral-600">Upload invoice to extract details</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Info Banner */}
            <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl">
              <p className="text-sm text-purple-900 leading-relaxed">
                <span className="font-semibold">✨ AI-Powered Extraction:</span> Upload your invoice (PDF, JPG, or PNG) 
                and we'll automatically extract product name, order ID, price, retailer, and more!
              </p>
            </div>

            {/* Upload Area */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              <div className="relative border-2 border-dashed border-neutral-300 rounded-xl p-8 text-center hover:border-purple-400 transition-colors bg-neutral-50">
                <input
                  type="file"
                  id="invoice-upload"
                  accept="application/pdf"
                  onChange={handleInvoiceUpload}
                  className="hidden"
                />
                <label
                  htmlFor="invoice-upload"
                  className="cursor-pointer flex flex-col items-center gap-3"
                >
                  <div className="p-4 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl">
                    <FileText className="w-10 h-10 text-purple-600" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-neutral-900 mb-1">
                      Click to upload invoice
                    </p>
                    <p className="text-sm text-neutral-500">
                      PDF only • Max 5MB
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Preview & Extract */}
            {invoiceFile && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-3"
              >
                <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-neutral-600" strokeWidth={2} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 truncate">
                        {invoiceFile.name}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {(invoiceFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleExtractData}
                  disabled={isExtracting}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-600 text-white rounded-xl font-semibold text-sm hover:shadow-xl hover:shadow-purple-500/40 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2.5} />
                      Extracting Data...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" strokeWidth={2.5} />
                      Extract Data from Invoice
                    </>
                  )}
                </button>
              </motion.div>
            )}

            {/* Features List */}
            <div className="pt-4 space-y-2">
              <p className="text-xs font-semibold text-neutral-700 uppercase tracking-wide mb-3">
                What we extract:
              </p>
              {[
                'Product Name',
                'Order ID / Serial Number',
                'Price & Purchase Date',
                'Retailer Information',
                'HSN/FSN Codes',
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-blue-500" />
                  <p className="text-sm text-neutral-600">{feature}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
