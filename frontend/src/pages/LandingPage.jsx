// frontend/src/pages/LandingPage.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SignInButton } from "@clerk/clerk-react";
import { 
  ArrowRight, 
  TrendingUp, 
  PieChart, 
  Zap, 
  Menu,
  X,
  Lock,
  Globe,
  BarChart3
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-[#050505]/80 backdrop-blur-xl border-b border-white/10 py-4' : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-black" strokeWidth={3} />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">FinFlow<span className="text-emerald-400">.</span></span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {['Features', 'Analytics', 'Security', 'Pricing'].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
              {item}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <SignInButton mode="modal">
            <button className="text-sm font-medium text-white hover:text-emerald-400 transition-colors cursor-pointer">Log in</button>
          </SignInButton>
          
          <SignInButton mode="modal">
            <button className="group relative px-5 py-2.5 bg-white text-black font-semibold rounded-full text-sm overflow-hidden transition-transform active:scale-95 cursor-pointer">
              <span className="relative z-10 flex items-center gap-2">
                Get Started <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-200 to-cyan-200 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </SignInButton>
        </div>

        <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#0a0a0a] border-b border-white/10 px-6 py-4"
          >
            <div className="flex flex-col gap-4">
              {['Features', 'Analytics', 'Security', 'Pricing'].map((item) => (
                <a key={item} href={`#${item.toLowerCase()}`} className="text-lg font-medium text-gray-300 hover:text-white">
                  {item}
                </a>
              ))}
              <div className="h-px bg-white/10 w-full my-2"></div>
              <SignInButton mode="modal">
                <button className="w-full py-3 text-white font-medium bg-white/5 rounded-lg border border-white/10 cursor-pointer">Log in</button>
              </SignInButton>
              <SignInButton mode="modal">
                <button className="w-full py-3 bg-emerald-500 text-black font-semibold rounded-lg cursor-pointer">Get Started</button>
              </SignInButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

const Hero = () => {
  return (
    <section className="relative min-h-screen bg-[#050505] flex items-center pt-32 pb-20 overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15], x: [0, 50, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-emerald-600/30 blur-[120px]"
        />
        <motion.div 
          animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.25, 0.1], y: [0, -50, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-[30%] -right-[10%] w-[40vw] h-[40vw] rounded-full bg-cyan-600/20 blur-[120px]"
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-16 items-center">
        <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-2xl">
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-xs font-semibold tracking-widest text-emerald-400 uppercase">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            FinFlow
          </motion.div>
          
          <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-bold text-white leading-[1.1] tracking-tight mb-6">
            Track smarter, <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Invest better.</span>
          </motion.h1>
          
          <motion.p variants={fadeUp} className="text-lg md:text-xl text-gray-400 mb-10 leading-relaxed font-light">
            Take absolute control of your financial destiny. FinFlow combines real-time tracking, predictive analytics, and bank-grade security into one seamless experience.
          </motion.p>
          
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4">
            <SignInButton mode="modal">
              <button className="group relative px-8 py-4 bg-white text-black font-semibold rounded-xl text-base overflow-hidden transition-transform active:scale-95 shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:shadow-[0_0_40px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 cursor-pointer">
                Start Building Wealth <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </SignInButton>
            <button className="px-8 py-4 bg-white/5 border border-white/10 text-white font-semibold rounded-xl hover:bg-white/10 backdrop-blur-md transition-all flex items-center justify-center cursor-pointer">
              View Live Demo
            </button>
          </motion.div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.8, rotateY: 20 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          className="relative perspective-1000 hidden lg:block"
        >
          <motion.div 
            animate={{ y: [-15, 15, -15] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="w-full rounded-2xl bg-[#0a0a0a]/80 border border-white/10 backdrop-blur-2xl shadow-2xl p-6"
          >
            <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-6">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total Net Worth</p>
                <p className="text-4xl font-bold text-white tabular-nums tracking-tight">₹1,42,850<span className="text-gray-600">.00</span></p>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium flex items-center gap-1">
                <TrendingUp className="w-4 h-4" /> +12.5%
              </div>
            </div>
            
            <div className="h-40 w-full flex items-end justify-between gap-2 mb-6">
              {[40, 55, 45, 70, 65, 85, 100].map((height, i) => (
                <div key={i} className="w-full relative group">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ duration: 1, delay: 0.5 + (i * 0.1), ease: "easeOut" }}
                    className={`w-full rounded-t-sm ${i === 6 ? 'bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-white/10'}`}
                  />
                </div>
              ))}
            </div>

            <div className="space-y-3">
              {[
                { name: 'Apple Inc. Stock', date: 'Today, 2:45 PM', amount: '+ ₹1,250.00', positive: true },
                { name: 'AWS Cloud Services', date: 'Yesterday', amount: '- ₹145.20', positive: false },
              ].map((tx, i) => (
                <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.positive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white'}`}>
                      {tx.positive ? <TrendingUp className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{tx.name}</p>
                      <p className="text-xs text-gray-500">{tx.date}</p>
                    </div>
                  </div>
                  <p className={`text-sm font-semibold tabular-nums ${tx.positive ? 'text-emerald-400' : 'text-white'}`}>
                    {tx.amount}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

const Features = () => {
  const features = [
    {
      icon: <PieChart className="w-6 h-6 text-cyan-400" />,
      title: "Smart Portfolio Allocation",
      desc: "Instantly visualize your asset distribution across global markets with real-time sync and auto-categorization."
    },
    {
      icon: <Zap className="w-6 h-6 text-emerald-400" />,
      title: "Lightning Fast Sync",
      desc: "Connect thousands of institutions securely. Your data updates in milliseconds, giving you an edge."
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-purple-400" />,
      title: "Predictive AI Modeling",
      desc: "Forecast your wealth trajectory based on algorithmic analysis of your spending and market trends."
    },
    {
      icon: <Lock className="w-6 h-6 text-rose-400" />,
      title: "Ironclad Security",
      desc: "AES-256 encryption at rest and in transit. Your financial data is yours alone, never sold or shared."
    }
  ];

  return (
    <section id="features" className="py-32 bg-[#050505] relative">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp} className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
            Everything you need. <br/> <span className="text-gray-500">Nothing you don't.</span>
          </h2>
        </motion.div>
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="group relative bg-white/[0.03] border border-white/5 rounded-2xl p-8 hover:bg-white/[0.05] transition-colors overflow-hidden">
              <div className="w-14 h-14 rounded-xl bg-[#111] border border-white/10 flex items-center justify-center mb-6 shadow-lg">{feature.icon}</div>
              <h3 className="text-2xl font-semibold text-white mb-3 tracking-tight">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed font-light">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="bg-[#050505] border-t border-white/10 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-600">
        <p>© 2026 FinFlow Inc. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="#!" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#!" className="hover:text-white transition-colors">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-emerald-500/30 selection:text-emerald-200">
      <Navbar />
      <main>
        <Hero />
        <Features />
      </main>
      <Footer />
    </div>
  );
}
