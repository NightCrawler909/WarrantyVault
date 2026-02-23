'use client';

import { motion } from 'framer-motion';
import { ScanLine, Layers, Search, ShieldCheck, Cloud, LayoutDashboard } from 'lucide-react';

const features = [
  {
    icon: <ScanLine className="w-6 h-6 text-purple-400" />,
    title: "AI Invoice Parsing",
    description: "Upload any invoice and let our OCR engine extract key details instantly."
  },
  {
    icon: <Layers className="w-6 h-6 text-blue-400" />,
    title: "Multi-page Support",
    description: "Handles long, complex invoices with multiple pages and tables effortlessly."
  },
  {
    icon: <Search className="w-6 h-6 text-pink-400" />,
    title: "Smart Detection",
    description: "Automatic classification of products, categories, and warranty terms."
  },
  {
    icon: <ShieldCheck className="w-6 h-6 text-green-400" />,
    title: "Expiry Alerts",
    description: "Get notified before your warranty expires so you're never caught off guard."
  },
  {
    icon: <Cloud className="w-6 h-6 text-cyan-400" />,
    title: "Secure Cloud Storage",
    description: "Your data is encrypted and backed up safely in the cloud."
  },
  {
    icon: <LayoutDashboard className="w-6 h-6 text-yellow-400" />,
    title: "Clean Dashboard",
    description: "A centralized view of all your assets, expenses, and coverage details."
  }
];

export default function FeaturesSection() {
  return (
    <section className="min-h-screen py-24 px-4 bg-[#050505]">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <span className="text-purple-500 font-semibold tracking-wider text-sm uppercase">Capabilities</span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mt-3 mb-6">Built for Power Users</h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Everything you need to manage warranties efficiently, wrapped in a beautiful interface.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ 
                y: -5,
                scale: 1.02,
                transition: { duration: 0.2 }
              }}
              className="group p-8 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-purple-500/50 hover:bg-white/[0.05] transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="bg-white/10 w-12 h-12 rounded-lg flex items-center justify-center mb-6 group-hover:bg-white/20 transition-colors">
                {feature.icon}
              </div>
              
              <h3 className="text-xl font-bold text-white mb-3 relative z-10">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed text-sm relative z-10">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
