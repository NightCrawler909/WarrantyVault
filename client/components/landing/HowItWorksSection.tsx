'use client';

import { motion } from 'framer-motion';

const steps = [
  { id: 1, title: "Upload Invoice", desc: "Digital or photo" },
  { id: 2, title: "AI Extraction", desc: "Data processed instantly" },
  { id: 3, title: "Verify Details", desc: "Confirm product info" },
  { id: 4, title: "Track Warranty", desc: "Automated countdown" },
  { id: 5, title: "Get Reminders", desc: "Never miss a deadline" }
];

export default function HowItWorksSection() {
  return (
    <section className="py-32 px-4 bg-black border-y border-white/5 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <motion.h2 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold text-center text-white mb-20"
        >
          How It Works
        </motion.h2>

        <div className="relative">
          {/* Connecting Line */}
          <div className="absolute top-1/2 left-0 w-full h-1 bg-white/10 -translate-y-1/2 hidden md:block" />
          <motion.div 
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-purple-900 via-purple-500 to-blue-500 -translate-y-1/2 origin-left hidden md:block" 
          />

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 relative z-10">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="flex flex-col items-center text-center"
              >
                <div className="w-16 h-16 rounded-full bg-[#111] border-4 border-purple-900 flex items-center justify-center text-xl font-bold text-white mb-6 shadow-xl relative z-10">
                  {step.id}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-gray-400">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
