import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import Silk from '@/components/ui/Silk';
import { Sparkles, ArrowRight } from 'lucide-react';
import ProblemSection from '@/components/landing/ProblemSection';
import SolutionSection from '@/components/landing/SolutionSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import TrustSection from '@/components/landing/TrustSection';
import CTASection from '@/components/landing/CTASection';

export default function Home() {
  return (
    <div className="relative w-full bg-black text-white selection:bg-purple-500/30 overflow-x-hidden">
      
      {/* Hero Section */}
      <div className="relative min-h-screen">
        {/* Background Layer */}
        <div className="absolute inset-0 z-0">
          <Silk
            speed={5}
            scale={1}
            color="#5227FF"
            noiseIntensity={1.5}
            rotation={0}
          />
        </div>
        
        {/* Floating Navbar */}
        <nav className="fixed top-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-4xl px-4">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-full px-6 py-4 flex items-center justify-between shadow-2xl transition-all hover:bg-white/10">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span className="text-lg font-bold tracking-tight">WarrantyVault</span>
            </div>
            <div className="flex items-center gap-6 text-sm font-medium text-gray-300">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 pointer-events-none">
          <div className="flex flex-col items-center max-w-4xl text-center pointer-events-auto">
            
            {/* Badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-gray-300 backdrop-blur-md transition-colors hover:bg-white/10">
              <span className="flex h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
              Never Lose Track
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 text-white drop-shadow-sm">
              Welcome to WarrantyVault
            </h1>
            
            <p className="text-xl text-gray-400 mb-12 max-w-2xl leading-relaxed">
               Never lose track of your warranties again. Managed simply, effectively, and beautifully.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 items-center">
              <Link href="/login">
                <Button className="h-12 px-8 rounded-full bg-white text-black hover:bg-gray-200 transition-all font-medium text-lg min-w-[160px] shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]">
                  Get Started
                </Button>
              </Link>
              <Link href="/dashboard">
                <span className="h-12 px-8 rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10 backdrop-blur-sm transition-all font-medium text-lg min-w-[160px] flex items-center justify-center cursor-pointer">
                  Learn More
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <ProblemSection />
      <SolutionSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TrustSection />
      <CTASection />
      
      {/* Footer */}
      <footer className="py-8 bg-black border-t border-white/10 text-center text-gray-500 text-sm">
        <p>© {new Date().getFullYear()} WarrantyVault. All rights reserved.</p>
      </footer>
    </div>
  );
}
