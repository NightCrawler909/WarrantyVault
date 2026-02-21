'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Check, X, Loader2, AlertCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '@/lib/apiClient';

interface ExtractedData {
  detectedProductName: string | null;
  detectedPurchaseDate: string | null;
  detectedOrderId: string | null;
  detectedAmount: number | null;
  detectedVendor: string | null;
  detectedHSN: string | null;
  detectedFSN: string | null;
}

interface InvoiceOCRExtractorProps {
  productId: string;
  hasInvoice: boolean;
  onDataExtracted?: (data: ExtractedData) => void;
}

export const InvoiceOCRExtractor: React.FC<InvoiceOCRExtractorProps> = ({
  productId,
  hasInvoice,
  onDataExtracted,
}) => {
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [editedData, setEditedData] = useState<ExtractedData | null>(null);

  const handleExtract = async () => {
    setIsExtracting(true);

    try {
      const response = await apiClient.post(`/products/${productId}/extract-invoice`);
      const data = response.data.data;

      setExtractedData(data);
      setEditedData(data);
      setShowPreview(true);

      toast.success('Invoice data detected successfully!');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to extract invoice data';
      toast.error(message, { duration: 4000 });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleAccept = () => {
    if (editedData) {
      onDataExtracted?.(editedData);
      setShowPreview(false);
      toast.success('Data applied to form!');
    }
  };

  const handleCancel = () => {
    setShowPreview(false);
    setExtractedData(null);
    setEditedData(null);
  };

  if (!hasInvoice) {
    return null;
  }

  return (
    <>
      {/* Extract Button with Info */}
      <div className="flex flex-col items-end gap-1.5">
        <motion.button
          onClick={handleExtract}
          disabled={isExtracting}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
            isExtracting
              ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:shadow-lg hover:shadow-purple-500/30'
          }`}
        >
          {isExtracting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
              Extracting...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" strokeWidth={2} />
              Auto Fill from Invoice
            </>
          )}
        </motion.button>
        <p className="text-xs text-neutral-500">
          Works best with JPG/PNG images
        </p>
      </div>

      {/* Extracted Data Preview Modal */}
      <AnimatePresence>
        {showPreview && extractedData && editedData && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCancel}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl p-6 pointer-events-auto"
              >
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <Sparkles className="w-5 h-5 text-purple-600" strokeWidth={2} />
                    </div>
                    <h3 className="text-xl font-semibold text-neutral-900">
                      Extracted Data
                    </h3>
                  </div>
                  <p className="text-sm text-neutral-500 ml-12">
                    Review and edit before applying
                  </p>
                </div>
                <button
                  onClick={handleCancel}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-neutral-500" strokeWidth={2} />
                </button>
              </div>

              {/* Extracted Fields */}
              <div className="space-y-4 mb-6">
                {/* Product Name */}
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1.5 tracking-wide">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={editedData.detectedProductName || ''}
                    onChange={(e) =>
                      setEditedData({ ...editedData, detectedProductName: e.target.value })
                    }
                    placeholder="Not detected"
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Vendor/Store */}
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1.5 tracking-wide">
                    Vendor/Store Name
                  </label>
                  <input
                    type="text"
                    value={editedData.detectedVendor || ''}
                    onChange={(e) =>
                      setEditedData({ ...editedData, detectedVendor: e.target.value })
                    }
                    placeholder="Not detected"
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Purchase Date */}
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1.5 tracking-wide">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    value={editedData.detectedPurchaseDate || ''}
                    onChange={(e) =>
                      setEditedData({ ...editedData, detectedPurchaseDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Order ID */}
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1.5 tracking-wide">
                    Order/Invoice ID
                  </label>
                  <input
                    type="text"
                    value={editedData.detectedOrderId || ''}
                    onChange={(e) =>
                      setEditedData({ ...editedData, detectedOrderId: e.target.value })
                    }
                    placeholder="Not detected"
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1.5 tracking-wide">
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editedData.detectedAmount || ''}
                    onChange={(e) =>
                      setEditedData({
                        ...editedData,
                        detectedAmount: parseFloat(e.target.value) || null,
                      })
                    }
                    placeholder="Not detected"
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* HSN/SAC Code */}
                {editedData.detectedHSN && (
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1.5 tracking-wide">
                      HSN/SAC Code
                    </label>
                    <input
                      type="text"
                      value={editedData.detectedHSN || ''}
                      onChange={(e) =>
                        setEditedData({ ...editedData, detectedHSN: e.target.value })
                      }
                      placeholder="Not detected"
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                )}

                {/* FSN (Flipkart Serial Number) */}
                {editedData.detectedFSN && (
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1.5 tracking-wide">
                      FSN (Product Code)
                    </label>
                    <input
                      type="text"
                      value={editedData.detectedFSN || ''}
                      onChange={(e) =>
                        setEditedData({ ...editedData, detectedFSN: e.target.value })
                      }
                      placeholder="Not detected"
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>

              {/* Warranty Period Reminder */}
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-3">
                <Clock className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
                <div>
                  <p className="text-xs font-medium text-amber-900 mb-1">
                    Don't forget to enter the warranty period!
                  </p>
                  <p className="text-xs text-amber-700">
                    Check your product manual or invoice for warranty duration (months/years)
                  </p>
                </div>
              </div>

              {/* Info Message */}
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg mb-6">
                <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
                <p className="text-xs text-blue-800">
                  Extracted data may not be 100% accurate. Please review and edit as needed.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2.5 border border-neutral-200 rounded-lg font-medium text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAccept}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-medium text-sm hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" strokeWidth={2} />
                  Apply to Form
                </button>
              </div>
            </motion.div>
          </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
