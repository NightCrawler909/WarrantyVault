'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { InvoiceOCRExtractor } from '@/components/products/InvoiceOCRExtractor';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Package, Calendar, DollarSign, Store, FileText, Clock } from 'lucide-react';
import { productService } from '@/services/productService';
import toast, { Toaster } from 'react-hot-toast';

interface ExtractedData {
  detectedProductName: string | null;
  detectedPurchaseDate: string | null;
  detectedOrderId: string | null;
  detectedAmount: number | null;
  detectedVendor: string | null;
  detectedHSN: string | null;
  detectedFSN: string | null;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasInvoice, setHasInvoice] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    purchaseDate: '',
    warrantyPeriod: '',
    price: '',
    retailer: '',
    serialNumber: '',
    notes: '',
  });

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        const data = await productService.getProductById(productId);
        
        setFormData({
          name: data.name || '',
          purchaseDate: data.purchaseDate ? new Date(data.purchaseDate).toISOString().split('T')[0] : '',
          warrantyPeriod: data.warrantyPeriod?.toString() || '',
          price: data.price?.toString() || '',
          retailer: data.retailer || '',
          serialNumber: data.serialNumber || '',
          notes: data.notes || '',
        });
        
        setHasInvoice(!!data.invoiceUrl);
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to load product');
        router.push('/products');
      } finally {
        setIsLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const handleExtractedData = (data: ExtractedData) => {
    // Auto-fill form with extracted data
    const updates: any = {};

    if (data.detectedProductName && !formData.name) {
      updates.name = data.detectedProductName;
    }

    if (data.detectedVendor && !formData.retailer) {
      updates.retailer = data.detectedVendor;
    }

    if (data.detectedPurchaseDate && !formData.purchaseDate) {
      updates.purchaseDate = data.detectedPurchaseDate;
    }

    if (data.detectedAmount && !formData.price) {
      updates.price = data.detectedAmount.toString();
    }

    if (data.detectedOrderId && !formData.serialNumber) {
      updates.serialNumber = data.detectedOrderId;
    }

    // Add HSN/FSN to notes for warranty claims
    let additionalInfo = [];
    if (data.detectedHSN) {
      additionalInfo.push(`HSN/SAC: ${data.detectedHSN}`);
    }
    if (data.detectedFSN) {
      additionalInfo.push(`FSN: ${data.detectedFSN}`);
    }
    
    if (additionalInfo.length > 0) {
      const existingNotes = formData.notes ? formData.notes + '\n\n' : '';
      updates.notes = existingNotes + additionalInfo.join('\n');
    }

    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await productService.updateProduct(productId, {
        ...formData,
        warrantyPeriod: parseInt(formData.warrantyPeriod),
        price: formData.price ? parseFloat(formData.price) : undefined,
      });

      toast.success('Product updated successfully!');
      router.push(`/products/${productId}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update product');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Toaster position="top-right" />
      
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 mb-4 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
              Edit Product
            </h1>

            {/* OCR Extractor Button */}
            <InvoiceOCRExtractor
              productId={productId}
              hasInvoice={hasInvoice}
              onDataExtracted={handleExtractedData}
            />
          </div>
        </motion.div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl p-6 shadow-sm shadow-black/5 border border-neutral-200"
        >
          <div className="space-y-6">
            {/* Product Name */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
                <Package className="w-4 h-4" strokeWidth={2} />
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., iPhone 14 Pro"
              />
            </div>

            {/* Purchase Date & Warranty Period */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
                  <Calendar className="w-4 h-4" strokeWidth={2} />
                  Purchase Date *
                </label>
                <input
                  type="date"
                  name="purchaseDate"
                  value={formData.purchaseDate}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
                  <Clock className="w-4 h-4" strokeWidth={2} />
                  Warranty Period (months) *
                </label>
                <input
                  type="number"
                  name="warrantyPeriod"
                  value={formData.warrantyPeriod}
                  onChange={handleChange}
                  required
                  min="1"
                  className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 12"
                />
                <p className="text-xs text-neutral-500 mt-1.5">
                  Check your invoice or product manual for warranty duration. Common: 6, 12, 24, 36 months
                </p>
              </div>
            </div>

            {/* Price & Retailer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
                  <DollarSign className="w-4 h-4" strokeWidth={2} />
                  Price
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 999.99"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
                  <Store className="w-4 h-4" strokeWidth={2} />
                  Retailer
                </label>
                <input
                  type="text"
                  name="retailer"
                  value={formData.retailer}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Amazon"
                />
              </div>
            </div>

            {/* Serial Number */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
                <FileText className="w-4 h-4" strokeWidth={2} />
                Serial Number / Order ID
              </label>
              <input
                type="text"
                name="serialNumber"
                value={formData.serialNumber}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., SN123456789"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
                <FileText className="w-4 h-4" strokeWidth={2} />
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Additional information about this product..."
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 border border-neutral-200 rounded-xl font-medium text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium text-sm hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" strokeWidth={2} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </motion.form>
      </div>
    </DashboardLayout>
  );
}
