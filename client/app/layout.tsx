import type { Metadata } from 'next';
import { Figtree } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { Toaster } from 'react-hot-toast';

import '@/components/common/SmoothScroll';
import SmoothScroll from '@/components/common/SmoothScroll';

const figtree = Figtree({ 
  subsets: ['latin-ext'],
  weight: ['400', '800'],
  display: 'swap',
});

// Import locomotive-scroll styles (can be done in globals.css, but user asked for @import style)
// Since this is Next.js App Router, we should import css in a global CSS file or here globally.
// However, Locomotive Scroll 5 doesn't strictly require CSS for basic functionality if built on Lenis, 
// but for data-scroll attributes it might be needed.
// Attempting to import css directly might fail if node_modules path isn't resolved by postcss/css modules properly without configuration, 
// but importing in layout is standard for global styles.
import 'locomotive-scroll/dist/locomotive-scroll.css';

export const metadata: Metadata = {
  title: 'WarrantyVault - Manage Your Product Warranties',
  description: 'Effortlessly track and manage all your product warranties in one place',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${figtree.className} bg-[#f5f7fa] text-neutral-900 antialiased`}>
        <SmoothScroll>
          <ThemeProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </ThemeProvider>
          <Toaster 
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#fff',
                  color: '#0a0a0a',
                  border: '1px solid #e5e5e5',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  fontSize: '14px',
                  fontWeight: 500,
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
        </SmoothScroll>
      </body>
    </html>
  );
}
