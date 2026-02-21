'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { InvoiceUploadSection } from '@/components/products/InvoiceUploadSection';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Package, DollarSign, Store, FileText, Clock, Edit } from 'lucide-react';
import { productService } from '@/services/productService';
import toast, { Toaster } from 'react-hot-toast';

interface Product {
  _id: string;
  name: string;
  category: string;
  purchaseDate: string;
  warrantyPeriod: number;
  warrantyExpiry: string;
  price?: number;
  retailer?: string;
  serialNumber?: string;
  notes?: string;
  status: string;
  remainingDays: number;
  invoiceUrl?: string;
  invoiceFileName?: string;
  invoiceSize?: number;
  invoiceMimeType?: string;
}

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProduct = async () => {
    try {
      setIsLoading(true);
      const data = await productService.getProductById(productId);
      setProduct(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load product');
      router.push('/products');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return { color: 'text-emerald-700', bg: 'bg-emerald-50', label: 'Active' };
      case 'expiring':
        return { color: 'text-amber-700', bg: 'bg-amber-50', label: 'Expiring Soon' };
      case 'expired':
        return { color: 'text-red-700', bg: 'bg-red-50', label: 'Expired' };
      default:
        return { color: 'text-neutral-700', bg: 'bg-neutral-50', label: status };
    }
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

  if (!product) {
    return null;
  }

  const statusConfig = getStatusConfig(product.status);
  const invoice = product.invoiceUrl
    ? {
        fileName: product.invoiceFileName || 'invoice',
        size: product.invoiceSize || 0,
        mimeType: product.invoiceMimeType || 'application/pdf',
        url: product.invoiceUrl,
      }
    : null;

  return (
    <DashboardLayout>
      <Toaster position="top-right" />
      
      <div className="max-w-4xl mx-auto">
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
            Back to Products
          </button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 mb-2">
                {product.name}
              </h1>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                  {statusConfig.label}
                </span>
                <span className="text-sm text-neutral-500">
                  {product.remainingDays >= 0
                    ? `${product.remainingDays} days remaining`
                    : `Expired ${Math.abs(product.remainingDays)} days ago`}
                </span>
              </div>
            </div>
            
            {/* Edit Button */}
            <Link href={`/products/${product._id}/edit`}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors duration-200"
              >
                <Edit className="w-4 h-4" strokeWidth={2} />
                Edit
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Product Details Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-sm shadow-black/5 border border-neutral-200"
          >
            <h3 className="text-lg font-medium text-neutral-900 tracking-tight mb-4">
              Product Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <Calendar className="w-4 h-4 text-emerald-600" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-xs text-neutral-500 tracking-wide mb-0.5">Purchase Date</p>
                  <p className="text-sm font-medium text-neutral-900">
                    {formatDate(product.purchaseDate)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Clock className="w-4 h-4 text-purple-600" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-xs text-neutral-500 tracking-wide mb-0.5">Warranty Period</p>
                  <p className="text-sm font-medium text-neutral-900">
                    {product.warrantyPeriod} months
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-50 rounded-lg">
                  <Calendar className="w-4 h-4 text-amber-600" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-xs text-neutral-500 tracking-wide mb-0.5">Warranty Expiry</p>
                  <p className="text-sm font-medium text-neutral-900">
                    {formatDate(product.warrantyExpiry)}
                  </p>
                </div>
              </div>

              {product.price && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <DollarSign className="w-4 h-4 text-green-600" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 tracking-wide mb-0.5">Price</p>
                    <p className="text-sm font-medium text-neutral-900">
                      ${product.price.toFixed(2)}
                    </p>
                  </div>
                </div>
              )}

              {product.retailer && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-indigo-50 rounded-lg">
                    <Store className="w-4 h-4 text-indigo-600" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 tracking-wide mb-0.5">Retailer</p>
                    <p className="text-sm font-medium text-neutral-900">
                      {product.retailer}
                    </p>
                  </div>
                </div>
              )}

              {product.serialNumber && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-pink-50 rounded-lg">
                    <FileText className="w-4 h-4 text-pink-600" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 tracking-wide mb-0.5">Serial Number</p>
                    <p className="text-sm font-medium text-neutral-900">
                      {product.serialNumber}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {product.notes && (
              <div className="mt-4 pt-4 border-t border-neutral-200">
                <p className="text-xs text-neutral-500 tracking-wide mb-1">Notes</p>
                <p className="text-sm text-neutral-700">{product.notes}</p>
              </div>
            )}
          </motion.div>

          {/* Invoice Upload Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <InvoiceUploadSection
              productId={product._id}
              existingInvoice={invoice}
              onUploadSuccess={fetchProduct}
            />
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
