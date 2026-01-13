import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowTrendingUpIcon, 
  DocumentTextIcon, 
  ShieldCheckIcon, 
  ChartBarIcon, 
  ChevronRightIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export const LandingPage: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen text-[#111111] font-sans overflow-x-hidden selection:bg-emerald-100 relative bg-[#F9F8F3]">
      {/* Background Artifacts */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <motion.div 
          animate={{ 
            x: [0, 40, 0],
            y: [0, -30, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] left-[-10%] w-[80%] h-[80%] bg-emerald-200/40 blur-[130px] rounded-full" 
        />
        <motion.div 
          animate={{ 
            x: [0, -50, 0],
            y: [0, 40, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-15%] right-[-15%] w-[70%] h-[70%] bg-blue-200/40 blur-[110px] rounded-full" 
        />
        <motion.div 
          animate={{ 
            x: [0, 30, 0],
            y: [0, 50, 0],
            scale: [1, 1.15, 1]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[5%] left-[10%] w-[60%] h-[60%] bg-purple-200/30 blur-[100px] rounded-full" 
        />
      </div>

      {/* Navbar */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-6xl bg-white/80 backdrop-blur-3xl border border-white/60 rounded-[28px] shadow-[0_20px_70px_-15px_rgba(0,0,0,0.08)]">
        <div className="px-8 mx-auto">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center flex-shrink-0 gap-3 cursor-pointer group"
            >
              <div className="relative flex items-center justify-center">
                {/* Animated Background Glow */}
                <motion.div 
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3]
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-2xl blur-md"
                />
                <div className="relative flex items-center justify-center w-10 h-10 text-white transition-all duration-300 shadow-lg bg-gradient-to-br from-emerald-500 to-blue-600 rounded-2xl shadow-emerald-500/30 group-hover:shadow-emerald-500/50 group-hover:scale-105">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="white" fillOpacity="0.2"/>
                    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-transparent bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text">LMA Nexus</span>
                <div className="text-[9px] font-bold tracking-widest text-emerald-600 uppercase -mt-0.5">Loan Intelligence</div>
              </div>
            </motion.div>

            {/* Desktop Links */}
            <div className="items-center hidden space-x-10 md:flex">
              {[{ name: 'Features', href: '#features' }, { name: 'Integrations', href: '#integrations' }, { name: 'Security', href: '#security' }, { name: 'About', href: '#about' }].map((item, index) => (
                <motion.a
                  key={item.name}
                  href={item.href}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="text-[13px] font-bold transition-all text-slate-600 hover:text-slate-900 relative group/link"
                >
                  {item.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-emerald-500 to-blue-500 transition-all group-hover/link:w-full rounded-full" />
                </motion.a>
              ))}
            </div>

            {/* Login Link */}
            <div className="hidden md:flex">
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                onClick={() => navigate('/login')}
                className="px-6 py-2.5 text-[13px] font-bold text-slate-700 transition-all bg-transparent rounded-xl hover:bg-slate-100"
              >
                Sign In
              </motion.button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-slate-900"
              >
                {isMobileMenuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white/95 backdrop-blur-xl border-t md:hidden border-slate-100 rounded-b-[28px]"
            >
              <div className="px-4 pt-2 pb-6 space-y-2">
                {[{ name: 'Features', href: '#features' }, { name: 'Integrations', href: '#integrations' }, { name: 'Security', href: '#security' }].map((item) => (
                  <a key={item.name} href={item.href} className="block px-3 py-2 text-base font-medium rounded-md text-slate-600 hover:bg-slate-50" onClick={() => setIsMobileMenuOpen(false)}>
                    {item.name}
                  </a>
                ))}
                <div className="pt-4 space-y-2">
                  <button onClick={() => navigate('/login')} className="block w-full px-3 py-2 text-base font-medium text-left rounded-md text-slate-600 hover:bg-slate-50">
                    Sign In
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <main className="relative pt-20 pb-16 overflow-hidden lg:pt-32 lg:pb-20">
          
        <div className="relative z-10 px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          
          {/* Background Gradient */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] bg-gradient-to-b from-white to-transparent rounded-full blur-3xl -z-10 opacity-40" />

          {/* Text Content */}
          <div className="relative max-w-4xl mx-auto mb-8 text-center lg:mb-12">
            {/* Floating Deco - Left */}
            <div className="absolute top-0 hidden -left-24 xl:block">
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map(i => (
                  <motion.div 
                    key={`deco-l-${i}`}
                    animate={{ y: [0, -10, 0], rotate: i % 2 === 0 ? [0, 5, 0] : [0, -5, 0] }}
                    transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut" }}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center border border-slate-200/50 ${i === 2 ? 'bg-[#00F0A0] shadow-lg shadow-[#00F0A0]/20' : 'bg-white shadow-sm'}`}
                  >
                    {i === 2 ? <div className="w-4 h-4 rotate-45 bg-white rounded-sm mix-blend-overlay"></div> : <div className="w-1.5 h-1.5 bg-slate-100 rounded-full"></div>}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Floating Deco - Right */}
            <div className="absolute top-0 hidden -right-24 xl:block">
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map(i => (
                  <motion.div 
                    key={`deco-r-${i}`}
                    animate={{ y: [0, 10, 0], rotate: i % 2 === 0 ? [0, -5, 0] : [0, 5, 0] }}
                    transition={{ duration: 5 + i, repeat: Infinity, ease: "easeInOut" }}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center border border-slate-200/50 ${i === 3 ? 'bg-[#FFD200] shadow-lg shadow-[#FFD200]/20' : 'bg-white shadow-sm'}`}
                  >
                    {i === 3 ? <div className="w-4 h-4 rotate-45 bg-white rounded-sm mix-blend-overlay"></div> : <div className="w-1.5 h-1.5 bg-slate-100 rounded-full"></div>}
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.h1 
              initial={{ opacity: 0.7, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-5xl md:text-[72px] font-bold tracking-tight text-[#111111] mb-6 leading-[1.05]"
            >
              One place for all <br />
              <span className="text-[#111111]/90">
                digital loan assets
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="max-w-2xl mx-auto mb-8 text-base font-medium leading-relaxed md:text-lg text-slate-500"
            >
              Transform static legal text into intelligent, structured digital twins. <br className="hidden md:block" />
              Automate drift detection and ensure deal-wide consistency.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex items-center justify-center gap-4"
            >
              <button
                onClick={handleGetStarted}
                className="px-8 py-3.5 text-base font-bold text-white transition-all bg-black shadow-2xl rounded-2xl hover:bg-emerald-600 hover:scale-105 active:scale-95 shadow-emerald-500/10"
              >
                Launch Platform
              </button>
              <button className="px-8 py-3.5 text-base font-bold text-black border border-black/10 bg-white shadow-xl rounded-2xl hover:bg-slate-50 transition-all">
                View Demo
              </button>
            </motion.div>
          </div>

          {/* Dashboard Preview */}
          <motion.div 
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative max-w-[1240px] mx-auto mt-10 px-4"
          >
            {/*Main App Window */}
            <div className="relative z-10 overflow-hidden bg-white border border-slate-200/80 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] rounded-[40px]">
              
              {/* Internal Dashboard Nav */}
              <div className="flex items-center justify-between h-16 px-8 bg-white border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-5 h-5 text-white bg-black rounded-md">
                        <ShieldCheckIcon className="w-3 h-3" />
                    </div>
                    <span className="text-sm font-bold tracking-tight">Project Horizon</span>
                </div>
                
                <div className="flex items-center gap-1 bg-[#F5F5F5] p-1 rounded-2xl">
                    {['Overview', 'Digital Twin', 'Impact Map', 'Audit'].map((item, idx) => (
                        <div key={item} className={`px-4 py-1.5 rounded-xl text-[12px] font-bold cursor-pointer transition-all ${idx === 1 ? 'bg-white shadow-sm text-black' : 'text-slate-400 hover:text-slate-600'}`}>
                            {item}
                        </div>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-2 py-1 border rounded-lg bg-emerald-50 border-emerald-100">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                        <span className="text-[10px] font-bold text-emerald-700">98% Deal Integrity</span>
                    </div>
                    <img src="https://i.pravatar.cc/150?u=ma" className="w-8 h-8 border rounded-full border-slate-200" alt="User" />
                </div>
              </div>

              <div className="p-8 bg-white min-h-[500px]">
                  <div className="grid grid-cols-12 gap-8">
                    {/* Left Column: Data Twins */}
                    <div className="col-span-12 lg:col-span-7">
                        <div className="mb-6">
                            <h2 className="mb-1 text-2xl font-bold tracking-tight text-slate-800">Covenant Structure</h2>
                            <p className="text-[12px] text-slate-400 font-medium">Auto-extracted from LMA Section 21.2</p>
                        </div>

                        <div className="mb-8 space-y-3">
                            {[
                                { label: "Leverage Ratio", value: "3.50x", status: "Balanced", color: "emerald" },
                                { label: "Interest Cover", value: "4.25x", status: "Safe", color: "blue" },
                                { label: "EBITDA Margin", value: "22.4%", status: "At Risk", color: "orange" }
                            ].map((item, i) => (
                                <motion.div 
                                    key={i}
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.8 + (i * 0.1) }}
                                    className="flex items-center justify-between p-4 transition-all border group bg-slate-50/50 border-slate-100/80 rounded-2xl hover:bg-white hover:shadow-lg"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg bg-${item.color}-50 flex items-center justify-center text-${item.color}-600`}>
                                            <ChartBarIcon className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-bold text-slate-600">{item.label}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-mono text-sm font-bold text-black">{item.value}</span>
                                        <div className={`px-2 py-0.5 rounded-md bg-${item.color}-50 border border-${item.color}-100 text-[10px] font-bold text-${item.color}-600`}>
                                            {item.status}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Impact Map Simulation */}
                        <div className="relative flex items-center justify-center h-40 overflow-hidden border border-dashed bg-slate-50 rounded-2xl border-slate-200">
                            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                            <div className="relative z-10 flex items-center gap-12">
                                <div className="flex items-center justify-center w-10 h-10 bg-white border rounded-lg shadow-sm border-slate-200 text-slate-400"><DocumentTextIcon className="w-5 h-5"/></div>
                                <div className="relative">
                                    <div className="w-24 h-0.5 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                    <motion.div 
                                        animate={{ x: [0, 96, 0] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                        className="absolute top-[-4px] left-0 w-2 h-2 bg-emerald-400 rounded-full"
                                    />
                                </div>
                                <div className="w-10 h-10 bg-emerald-50 border border-emerald-200 shadow-sm rounded-lg flex items-center justify-center text-emerald-600 font-bold text-[10px]">94%</div>
                            </div>
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-300 uppercase tracking-widest">Digital Dependency Graph</div>
                        </div>
                    </div>

                    {/* Right Column: Drift Alerts */}
                    <div className="col-span-12 lg:col-span-5">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-bold text-slate-800">Commercial Drift</h3>
                            <div className="px-2 py-0.5 bg-red-50 text-[10px] font-bold text-red-600 rounded-md border border-red-100">4 Active</div>
                        </div>

                        <div className="space-y-4">
                            {[
                                { name: "Margin Change", type: "Finanical", severity: "High", color: "red", desc: "2.5% → 2.75% Deviation" },
                                { name: "EBITDA Definition", type: "Legal", severity: "Medium", color: "orange", desc: "Non-standard exclusion found" },
                                { name: "Reporting Clause", type: "Operational", severity: "Low", color: "blue", desc: "30 day grace period" }
                            ].map((drift, i) => (
                                <motion.div 
                                    key={i}
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 1 + (i * 0.1) }}
                                    className="p-4 transition-colors bg-white border cursor-pointer border-slate-100 rounded-2xl hover:bg-slate-50 group"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <div className="text-[13px] font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">{drift.name}</div>
                                            <div className="text-[11px] text-slate-400 font-medium">{drift.type}</div>
                                        </div>
                                        <div className={`px-2 py-0.5 rounded-md bg-${drift.color}-50 border border-${drift.color}-100 text-[9px] font-bold text-${drift.color}-600 uppercase`}>
                                            {drift.severity}
                                        </div>
                                    </div>
                                    <div className="text-[11px] text-slate-600 bg-slate-100/50 p-2 rounded-lg font-medium">{drift.desc}</div>
                                </motion.div>
                            ))}
                        </div>

                        <div className="relative p-4 mt-8 overflow-hidden text-white bg-black/95 rounded-2xl">
                            <div className="absolute top-[-20px] right-[-20px] w-20 h-20 bg-emerald-500/20 blur-2xl rounded-full" />
                            <div className="relative z-10">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-1">AI Recommendation</div>
                                <div className="text-[12px] font-medium leading-relaxed">Map markup "Term SOFR" to "Base Rate" variable. <span className="font-bold text-emerald-300">94% Confidence.</span></div>
                            </div>
                        </div>
                    </div>
                  </div>
                </div>
            </div>
            
            {/* Soft Shadow Glows */}
            <div className="absolute h-40 rounded-full -bottom-20 left-20 right-20 bg-black/5 blur-3xl -z-10"></div>
          </motion.div>
        </div>
      </main>


      {/* Integrations Section */}
      <section id="integrations" className="relative py-24 overflow-hidden">
        {/* Background Blobs */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-100/40 blur-[100px] rounded-full -z-10" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-emerald-100/30 blur-[80px] rounded-full -z-10" />
        
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-4 text-4xl md:text-5xl font-bold tracking-tight text-[#111111]"
            >
              Enterprise Ecosystem
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="max-w-2xl mx-auto text-lg font-medium text-slate-500"
            >
              LMA Nexus lives where your data does. Seamlessly connect with the tools your team already uses.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { name: 'Document Management', desc: 'SharePoint, Box, Dropbox', icon: '📁' },
              { name: 'Loan Systems', desc: 'LoanIQ, Fusion, Summit', icon: '🏦' },
              { name: 'Data Warehouses', desc: 'Snowflake, Databricks', icon: '☁️' },
              { name: 'APIs & Webhooks', desc: 'RESTful API access', icon: '⚡' }
            ].map((integration, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5 }}
                className="p-8 transition-all bg-white/60 backdrop-blur-xl border border-white/80 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:shadow-xl hover:bg-white/80"
              >
                <div className="mb-4 text-3xl">{integration.icon}</div>
                <h3 className="mb-2 text-lg font-bold text-[#111111]">{integration.name}</h3>
                <p className="text-sm font-medium text-slate-500">{integration.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="relative py-24 bg-[#F5F7F5] overflow-hidden rounded-[60px] mx-4 mb-24 lg:mx-8 border border-white">
        {/* Lighter Background Artifacts */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-200/40 blur-[130px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100/30 blur-[110px] rounded-full" />

        <div className="relative z-10 px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 mb-6 border rounded-full border-emerald-200 bg-emerald-50"
            >
              <ShieldCheckIcon className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold tracking-widest uppercase text-emerald-600">Bank-Grade Infrastructure</span>
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-4 text-4xl md:text-5xl font-bold tracking-tight text-[#111111] leading-[1.1]"
            >
              Fortress for your <br />
              legal assets
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { 
                title: 'End-to-End Encryption', 
                icon: ShieldCheckIcon, 
                desc: 'AES-256 encryption at rest and TLS 1.3 in transit. Your documents are never exposed.',
                badge: 'SOC 2 Type II'
              },
              { 
                title: 'Role-Based Access', 
                icon: ShieldCheckIcon, 
                desc: 'Granular permissions at workspace, facility, and document levels with full SSO integration.',
                badge: 'ISO 27001'
              },
              { 
                title: 'Compliance & Audit', 
                icon: DocumentTextIcon, 
                desc: 'Complete audit logs for regulatory compliance. GDPR, SOX, and GLBA compliant storage.',
                badge: 'GDPR Ready'
              }
            ].map((security, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 transition-all border border-white bg-white/80 backdrop-blur-sm rounded-3xl hover:shadow-xl hover:bg-white"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center justify-center w-12 h-12 text-emerald-600 bg-emerald-50 rounded-2xl">
                    <security.icon className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 text-[10px] font-bold tracking-wider text-emerald-600 border border-emerald-100 rounded-full uppercase bg-emerald-50/50">
                    {security.badge}
                  </span>
                </div>
                <h3 className="mb-3 text-xl font-bold text-[#111111]">{security.title}</h3>
                <p className="font-medium leading-relaxed text-slate-500">{security.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-10 mt-12 text-center border bg-white border-white rounded-[40px] shadow-sm"
          >
            <h3 className="mb-4 text-2xl font-bold text-[#111111]">Hosted on Trusted Infrastructure</h3>
            <p className="max-w-3xl mx-auto text-lg font-medium text-slate-500">
              LMA Nexus operates on AWS isolated environments with multi-region redundancy, real-time threat detection, and a 99.99% uptime guarantee for enterprise customers.
            </p>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="relative py-24 overflow-hidden">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="grid items-center grid-cols-1 gap-20 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="w-12 h-1 mb-8 bg-black rounded-full" />
              <h2 className="mb-8 text-4xl md:text-5xl font-bold tracking-tight text-[#111111] leading-[1.05]">
                By operations experts, <br />
                for operations experts.
              </h2>
              <p className="mb-8 text-lg font-medium leading-relaxed text-slate-500">
                Founded by veterans of the syndicated loan market, LMA Nexus was built to solve the systematic inefficiencies in document lifecycle management. 
              </p>
              <p className="mb-12 text-lg font-medium leading-relaxed text-slate-500">
                We believe that legal agreements shouldn't be static PDFs—they should be intelligent, structured digital assets that power your entire deal portfolio.
              </p>
              
              <div className="grid grid-cols-2 gap-8">
                {[
                  { metric: '10M+', label: 'Clauses Analyzed' },
                  { metric: '99.9%', label: 'Extraction Accuracy' },
                  { metric: '12s', label: 'Average Processing' },
                  { metric: '24/7', label: 'Continuous Audit' }
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="text-3xl font-bold text-[#111111] mb-1">{stat.metric}</div>
                    <div className="text-sm font-bold tracking-widest uppercase text-slate-400">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* Decorative Background Elements */}
              <div className="absolute top-[-20%] right-[-20%] w-[120%] h-[120%] bg-emerald-100/50 blur-[100px] rounded-full -z-10" />
              
              <div className="p-10 border-2 bg-white/80 backdrop-blur-xl border-white rounded-[48px] shadow-2xl shadow-emerald-900/5">
                <h3 className="mb-8 text-2xl font-bold text-[#111111]">Why make the switch?</h3>
                <div className="space-y-6">
                  {[
                    'Automate 90% of manual reconciliation work',
                    'Catch commercial drifts in real-time',
                    'Standardize your entire deal portfolio',
                    'Regulatory-ready audit logs with provenance',
                    'Seamless LMA and custom template support'
                  ].map((benefit, i) => (
                    <motion.div 
                      key={i} 
                      className="flex items-start gap-4"
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * i }}
                    >
                      <div className="flex items-center justify-center flex-shrink-0 w-6 h-6 mt-1 text-white bg-[#111111] rounded-lg">
                        <ChevronRightIcon className="w-4 h-4" />
                      </div>
                      <span className="text-lg font-semibold text-slate-700">{benefit}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="p-16 relative overflow-hidden bg-white border border-slate-100 rounded-[64px] text-center shadow-[0_32px_64px_-12px_rgba(0,0,0,0.04)]"
          >
            {/* CTA Background Decoration (Light) */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
              <div className="absolute top-[-50%] left-[-20%] w-[80%] h-[150%] bg-emerald-100/40 blur-[120px] rounded-full rotate-12" />
              <div className="absolute bottom-[-50%] right-[-20%] w-[80%] h-[150%] bg-blue-50/30 blur-[120px] rounded-full -rotate-12" />
            </div>

            <div className="relative z-10">
              <h2 className="mb-6 text-4xl md:text-6xl font-bold tracking-tight text-[#111111] leading-[1.1]">
                The future of loan <br />
                operations is digital.
              </h2>
              <p className="max-w-2xl mx-auto mb-12 text-xl font-medium text-slate-500">
                Join the financial institutions modernizing their workflows with LMA Nexus.
              </p>
              <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
                <button
                  onClick={handleGetStarted}
                  className="w-full sm:w-auto px-10 py-5 text-lg font-bold text-white transition-all bg-[#111111] rounded-2xl hover:bg-emerald-600 hover:scale-105 active:scale-95 shadow-xl shadow-black/10"
                >
                  Launch LMA Nexus
                </button>
                <button className="w-full px-10 py-5 text-lg font-bold text-[#111111] transition-all border sm:w-auto border-slate-200 bg-white rounded-2xl hover:bg-slate-50">
                  Book Architecture Review
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
