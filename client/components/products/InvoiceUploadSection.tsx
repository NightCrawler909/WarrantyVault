'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, Download, AlertCircle, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '@/lib/apiClient';

interface InvoiceUploadSectionProps {
  productId: string;
  existingInvoice?: {
    fileName: string;
    size: number;
    mimeType: string;
    url: string;
  } | null;
  onUploadSuccess?: () => void;
}

export const InvoiceUploadSection: React.FC<InvoiceUploadSectionProps> = ({
  productId,
  existingInvoice,
  onUploadSuccess,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [invoice, setInvoice] = useState(existingInvoice);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const validateFile = (file: File) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Only PDF, JPEG, and PNG are allowed.');
      return false;
    }

    if (file.size > maxSize) {
      toast.error('File size exceeds 5MB limit.');
      return false;
    }

    return true;
  };

  const handleUpload = async (file: File) => {
    if (!validateFile(file)) return;

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('invoice', file);

    try {
      const response = await apiClient.post(`/products/${productId}/invoice`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          setUploadProgress(progress);
        },
      });

      const product = response.data.data;
      setInvoice({
        fileName: product.invoiceFileName,
        size: product.invoiceSize,
        mimeType: product.invoiceMimeType,
        url: product.invoiceUrl,
      });

      toast.success('Invoice uploaded successfully!');
      onUploadSuccess?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload invoice');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;

    try {
      await apiClient.delete(`/products/${productId}/invoice`);
      setInvoice(null);
      toast.success('Invoice deleted successfully!');
      onUploadSuccess?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete invoice');
    }
  };

  const handleView = async () => {
    try {
      const response = await apiClient.get(`/products/${productId}/invoice`, {
        responseType: 'blob',
      });

      // Create a blob URL and open it
      const blob = new Blob([response.data], { type: invoice?.mimeType || 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');

      // Clean up the URL after a delay
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (error: any) {
      toast.error('Failed to open invoice');
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleUpload(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm shadow-black/5 border border-neutral-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-neutral-900 tracking-tight">Invoice</h3>
      </div>

      <AnimatePresence mode="wait">
        {!invoice ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                isDragging
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-neutral-200 hover:border-neutral-300 bg-neutral-50'
              }`}
            >
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                disabled={isUploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />

              <div className="flex flex-col items-center gap-3">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <Upload className="w-6 h-6 text-blue-600" strokeWidth={2} />
                </div>

                <div>
                  <p className="text-sm font-medium text-neutral-900 mb-1">
                    {isUploading ? 'Uploading...' : 'Drop invoice here or click to browse'}
                  </p>
                  <p className="text-xs text-neutral-500">
                    PDF, JPEG, or PNG • Max 5MB
                  </p>
                </div>

                {isUploading && (
                  <div className="w-full max-w-xs mt-2">
                    <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        className="h-full bg-blue-600 rounded-full"
                      />
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">{uploadProgress}%</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="border border-neutral-200 rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                <FileText className="w-5 h-5 text-blue-600" strokeWidth={2} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">
                  {invoice.fileName}
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {formatFileSize(invoice.size)}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handleView}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors duration-200"
                  title="View invoice"
                >
                  <Download className="w-4 h-4 text-neutral-600" strokeWidth={2} />
                </button>

                <button
                  onClick={() => document.getElementById('replace-input')?.click()}
                  className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                >
                  Replace
                </button>

                <button
                  onClick={handleDelete}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors duration-200"
                  title="Delete invoice"
                >
                  <X className="w-4 h-4 text-red-600" strokeWidth={2} />
                </button>
              </div>
            </div>

            <input
              id="replace-input"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              className="hidden"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
