'use client';

import { motion } from 'framer-motion';
import { AlertCircle, FileWarning, Clock } from 'lucide-react';

const cards = [
  {
    icon: <FileWarning className="w-8 h-8 text-red-400" />,
    title: "Lost Invoices",
    description: "Paper invoices fade, get lost, or are impossible to find when you actually need to claim a warranty."
  },
  {
    icon: <Clock className="w-8 h-8 text-orange-400" />,
    title: "Expired Warranties",
    description: "Missing the expiration date by just one day means your expensive repair isn't covered anymore."
  },
  {
    icon: <AlertCircle className="w-8 h-8 text-yellow-400" />,
    title: "Manual Tracking Chaos",
    description: "Spreadsheets are tedious. Keeping mental notes is unreliable. You need a better system."
  }
];

export default function ProblemSection() {
  return (
    <section className="min-h-screen flex flex-col justify-center items-center py-20 px-4 bg-black relative">
      <div className="max-w-6xl w-full">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Stop Losing <span className="text-purple-500">Important Warranty Information</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Most people lose invoices, forget warranty periods, and struggle during product claims.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cards.map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              whileHover={{ scale: 1.05, borderColor: 'rgba(139, 92, 246, 0.5)' }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors"
            >
              <div className="bg-white/10 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                {card.icon}
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">{card.title}</h3>
              <p className="text-gray-400 leading-relaxed">
                {card.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
