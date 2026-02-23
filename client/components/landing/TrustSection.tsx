'use client';

import { motion } from 'framer-motion';

export default function TrustSection() {
  const stats = [
    { label: "Extraction Accuracy", value: "98%" },
    { label: "Faster Tracking", value: "3x" },
    { label: "Secure Storage", value: "100%" }
  ];

  return (
    <section className="py-24 px-4 bg-gradient-to-b from-[#0a0a0a] to-black">
      <div className="max-w-5xl mx-auto text-center">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-bold placeholder-opacity-100 bg-clip-text text-transparent bg-gradient-to-br from-white to-gray-500 mb-16"
        >
          Built for Accuracy. Designed for Reliability.
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2, type: "spring", stiffness: 100 }}
              className="p-8"
            >
              <div className="text-6xl font-black text-white mb-2 tracking-tighter">
                {stat.value}
              </div>
              <div className="text-purple-400 uppercase tracking-widest text-sm font-semibold">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
