'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { ArrowRight, Upload } from 'lucide-react';

export default function CTASection() {
  return (
    <section className="py-32 px-4 relative overflow-hidden flex items-center justify-center">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-purple-950/20 to-black pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-4xl mx-auto text-center px-6 py-16 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl"
      >
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-purple-600/10 blur-3xl -z-10 rounded-full" />

        <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
          Start Managing Your<br/> Warranties Smarter
        </h2>
        <p className="text-xl text-gray-400 mb-10 max-w-lg mx-auto">
          Join thousands of users who never miss a warranty claim again.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
           <Link href="/dashboard">
              <Button className="h-14 px-8 rounded-full bg-white text-black hover:bg-gray-200 text-lg font-bold flex items-center gap-2">
                Go to Dashboard <ArrowRight className="w-5 h-5" />
              </Button>
           </Link>
           <Link href="/dashboard?action=upload">
              <Button variant="outline" className="h-14 px-8 rounded-full border-white/20 bg-transparent text-white hover:bg-white/10 text-lg font-medium flex items-center gap-2">
                <Upload className="w-5 h-5" /> Upload Invoice
              </Button>
           </Link>
        </div>
      </motion.div>
    </section>
  );
}
