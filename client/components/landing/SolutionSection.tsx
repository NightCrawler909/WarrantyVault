'use client';

import { motion } from 'framer-motion';
import { Upload, Cpu, FileText, Bell, CheckCircle } from 'lucide-react';

const steps = [
  { text: "Upload any invoice (PDF/Image)", icon: <Upload className="w-5 h-5" /> },
  { text: "AI instantly extracts product details", icon: <Cpu className="w-5 h-5" /> },
  { text: "Auto-fill warranty forms", icon: <FileText className="w-5 h-5" /> },
  { text: "Track expiration dates automatically", icon: <CheckCircle className="w-5 h-5" /> },
  { text: "Get timely reminders before expiry", icon: <Bell className="w-5 h-5" /> }
];

export default function SolutionSection() {
  return (
    <section className="min-h-screen flex items-center py-20 px-4 bg-gradient-to-b from-black to-[#0a0a0a]">
      <div className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        {/* Left Content */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-purple-200 mb-8">
            Smart Warranty Management, Automated.
          </h2>
          <p className="text-xl text-gray-400 mb-8 leading-relaxed">
            Forget manual entry. Our advanced AI scans your invoices, identifies products, dates, and prices, and organizes everything for you in seconds.
          </p>
          
          <div className="space-y-6">
            {steps.map((step, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex items-center gap-4 bg-white/5 p-4 rounded-lg border border-white/5 hover:border-purple-500/30 transition-colors"
              >
                <div className="bg-purple-600/20 p-2 rounded-full text-purple-400">
                  {step.icon}
                </div>
                <span className="text-lg text-gray-200">{step.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right Content - Mockup */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          {/* Abstract Glow Background */}
          <div className="absolute -inset-4 bg-gradient-to-r from-purple-600 to-blue-600 opacity-20 blur-3xl rounded-full" />
          
          <div className="relative bg-[#111] border border-white/10 rounded-2xl p-6 shadow-2xl overflow-hidden aspect-square flex flex-col">
            {/* Mock Dashboard Header */}
            <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
              <div className="w-32 h-4 bg-white/10 rounded-full animate-pulse" />
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-white/10" />
                <div className="w-8 h-8 rounded-full bg-purple-500/50" />
              </div>
            </div>

            {/* Mock Dashboard Content */}
            <div className="space-y-4 flex-1">
               {[1, 2, 3].map((_, i) => (
                 <div key={i} className="bg-white/5 p-4 rounded-lg flex items-center justify-between border border-white/5">
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded bg-gradient-to-br from-gray-700 to-gray-800" />
                     <div className="space-y-2">
                       <div className="w-24 h-3 bg-white/20 rounded" />
                       <div className="w-16 h-2 bg-white/10 rounded" />
                     </div>
                   </div>
                   <div className="w-20 h-6 bg-green-500/20 rounded-full" />
                 </div>
               ))}
               
               {/* Floating Overlay Card */}
               <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                  className="absolute bottom-8 right-8 bg-[#1a1a1a] p-6 rounded-xl border border-purple-500/30 shadow-xl w-64"
               >
                 <div className="flex items-center gap-3 mb-3">
                    <CheckCircle className="text-green-400 w-5 h-5" />
                    <span className="text-sm font-semibold text-white">Extraction Complete</span>
                 </div>
                 <div className="space-y-2">
                    <div className="h-2 bg-white/20 rounded w-full" />
                    <div className="h-2 bg-white/20 rounded w-3/4" />
                 </div>
               </motion.div>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
