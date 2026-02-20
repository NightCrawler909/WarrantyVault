'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { productService } from '@/services/productService';
import { Upload, Edit3, Sparkles, FileText, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import apiClient from '@/lib/apiClient';

type TabType = 'manual' | 'invoice';

export const AddProductForm = () => {
  const [activeTab, setActiveTab] = useState<TabType>('manual');
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    purchaseDate: '',
    warrantyPeriod: '',
    price: '',
    retailer: '',
    serialNumber: '',
    notes: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [uploadedInvoicePath, setUploadedInvoicePath] = useState<string | null>(null);
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

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a JPG or PNG image');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setInvoiceFile(file);
    toast.success('Invoice uploaded! Click "Extract Data" to auto-fill form.');
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
      toast.success('Data extracted successfully!');
      
      // Switch to manual tab to review/edit
      setActiveTab('manual');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to extract invoice data';
      
      if (message.includes('OCR only supports')) {
        toast.error('PDF files are not supported', { duration: 5000 });
        toast('Please upload a JPG or PNG image instead', { icon: '💡', duration: 5000 });
      } else {
        toast.error(message, { duration: 4000 });
      }
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <Card>
      {/* Tab Switcher */}
      <div className="flex border-b border-neutral-200 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('manual')}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors relative ${
            activeTab === 'manual'
              ? 'text-blue-600'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <Edit3 className="w-4 h-4" strokeWidth={2} />
          Manual Entry
          {activeTab === 'manual' && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
            />
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('invoice')}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors relative ${
            activeTab === 'invoice'
              ? 'text-blue-600'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <Upload className="w-4 h-4" strokeWidth={2} />
          Upload Invoice
          {activeTab === 'invoice' && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
            />
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'invoice' && (
          <motion.div
            key="invoice"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mb-6"
          >
            {/* Invoice Upload Section */}
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <Sparkles className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
                <div>
                  <h3 className="text-sm font-semibold text-blue-900 mb-1">
                    Smart Auto-Fill from Invoice
                  </h3>
                  <p className="text-xs text-blue-700">
                    Upload your invoice image (JPG/PNG) and we'll automatically extract product details, order ID, price, and more!
                  </p>
                </div>
              </div>

              {/* Upload Area */}
              <div className="border-2 border-dashed border-neutral-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  id="invoice-upload"
                  accept="image/jpeg,image/png"
                  onChange={handleInvoiceUpload}
                  className="hidden"
                />
                <label
                  htmlFor="invoice-upload"
                  className="cursor-pointer flex flex-col items-center gap-3"
                >
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <FileText className="w-8 h-8 text-blue-600" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900 mb-1">
                      Click to upload invoice
                    </p>
                    <p className="text-xs text-neutral-500">
                      JPG or PNG • Max 5MB
                    </p>
                  </div>
                </label>
              </div>

              {/* Preview & Extract */}
              {invoiceFile && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-neutral-600" strokeWidth={2} />
                      <div>
                        <p className="text-sm font-medium text-neutral-900">
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
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-medium text-sm hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isExtracting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                        Extracting Data...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" strokeWidth={2} />
                        Extract Data from Invoice
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form */}
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
            Common periods: 6, 12, 24, 36 months. Check your invoice or product manual.
          </p>
        </div>
        
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

        <Input
          label="Serial Number / Order ID"
          name="serialNumber"
          value={formData.serialNumber}
          onChange={handleChange}
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
  );
};
