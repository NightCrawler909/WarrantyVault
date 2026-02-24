'use client';

import { Input } from '@/components/ui/Input';
import { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  products: any[];
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({ 
  searchQuery, 
  setSearchQuery, 
  products 
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Filter products for suggestions based on current input
  const suggestions = searchQuery.trim() 
    ? products.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5) // Limit to top 5 suggestions
    : [];

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  return (
    <div className="relative w-full max-w-md" ref={wrapperRef}>
      <div className="relative">
        <Input
          placeholder="Search products..."
          className="pl-10 h-11 bg-white border-neutral-200 focus:ring-blue-500 focus:border-blue-500 rounded-xl shadow-sm"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400 pointer-events-none" />
      </div>

      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute mt-2 w-full bg-white border border-neutral-200 rounded-xl shadow-lg z-50 overflow-hidden"
          >
            {suggestions.map((product) => (
              <div
                key={product._id}
                className="px-4 py-3 hover:bg-neutral-50 cursor-pointer flex items-center justify-between transition-colors border-b border-neutral-100 last:border-0"
                onClick={() => {
                  setSearchQuery(product.name);
                  setShowSuggestions(false);
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-neutral-100 flex items-center justify-center text-xs text-neutral-500 font-medium">
                    {product.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-neutral-700 truncate">
                    {product.name}
                  </span>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
