import type { Metadata } from 'next';
import { Figtree } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { Toaster } from 'react-hot-toast';

const figtree = Figtree({ 
  subsets: ['latin-ext'],
  weight: ['400', '800'],
  display: 'swap',
});

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
        <ThemeProvider>
          <AuthProvider>
            {children}
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
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
