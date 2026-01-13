/**
 * Landing Page - LMA Nexus
 * Award-winning minimalistic professional landing page
 * Clean, no purple, no gradients
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Animated counter hook
const useCounter = (end: number, duration: number = 2000) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isVisible) return;
    
    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }, [end, duration, isVisible]);

  return { count, setIsVisible };
};

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Stats counters reflecting documented outcomes
  const reviewSpeed = useCounter(60, 1800);
  const issueReduction = useCounter(90, 2000);
  const reconSpeed = useCounter(40, 1700);
  const auditCoverage = useCounter(100, 2000);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      
      // Trigger counters when stats section is visible
      const statsSection = document.getElementById('stats-section');
      if (statsSection) {
        const rect = statsSection.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.8) {
          reviewSpeed.setIsVisible(true);
          issueReduction.setIsVisible(true);
          reconSpeed.setIsVisible(true);
          auditCoverage.setIsVisible(true);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGetStarted = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-sm shadow-sm' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">L</span>
              </div>
              <span className="text-xl font-semibold text-slate-900 tracking-tight">
                LMA Nexus
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-10">
              <a href="#features" className="text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors">
                How it Works
              </a>
              <a href="#security" className="text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors">
                Security
              </a>
              <a href="#contact" className="text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors">
                Contact
              </a>
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <button 
                onClick={handleGetStarted}
                className="text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={handleGetStarted}
                className="bg-slate-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
              >
                Get Started
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100">
            <div className="px-6 py-4 space-y-4">
              <a href="#features" className="block text-slate-600 hover:text-slate-900 text-sm font-medium">Features</a>
              <a href="#how-it-works" className="block text-slate-600 hover:text-slate-900 text-sm font-medium">How it Works</a>
              <a href="#security" className="block text-slate-600 hover:text-slate-900 text-sm font-medium">Security</a>
              <a href="#contact" className="block text-slate-600 hover:text-slate-900 text-sm font-medium">Contact</a>
              <button
                onClick={handleGetStarted}
                className="w-full bg-slate-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 lg:pt-40 lg:pb-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-slate-100 text-slate-700 text-sm font-medium mb-8">
              <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
              Digital twin for syndicated loan agreements
            </div>

            {/* Headline */}
            <h1 className="text-5xl lg:text-7xl font-bold text-slate-900 tracking-tight leading-[1.1] mb-6">
              Turn 400-page PDFs into
              <br />
              structured, governable data.
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed">
              LMA Nexus builds a live dependency graph of every clause, detects commercial drift in real time,
              and publishes golden-record exports for LoanIQ, Finastra, and downstream systems—without re-keying.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={handleGetStarted}
                className="w-full sm:w-auto bg-slate-900 text-white px-8 py-4 rounded-xl text-base font-semibold hover:bg-slate-800 transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                Get Started — It's Free
              </button>
              <button className="w-full sm:w-auto flex items-center justify-center gap-2 text-slate-700 px-8 py-4 rounded-xl text-base font-semibold hover:bg-slate-50 transition-colors border border-slate-200">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Watch Demo
              </button>
            </div>

            {/* Trust Badges */}
            <div className="mt-16 pt-10 border-t border-slate-100">
              <p className="text-sm text-slate-500 mb-6">Powering documentation for leading institutions</p>
              <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-50">
                <span className="text-2xl font-bold text-slate-400 tracking-tight">Agent Banks</span>
                <span className="text-2xl font-bold text-slate-400 tracking-tight">Legal Counsel</span>
                <span className="text-2xl font-bold text-slate-400 tracking-tight">Risk Committees</span>
                <span className="text-2xl font-bold text-slate-400 tracking-tight">Operations</span>
                <span className="text-2xl font-bold text-slate-400 tracking-tight">Servicing Teams</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats-section" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-slate-900 mb-2">
                {reviewSpeed.count}%
              </div>
              <div className="text-sm text-slate-600">Faster review cycles</div>
            </div>
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-slate-900 mb-2">
                {issueReduction.count}%
              </div>
              <div className="text-sm text-slate-600">Fewer post-close issues</div>
            </div>
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-slate-900 mb-2">
                {reconSpeed.count}%
              </div>
              <div className="text-sm text-slate-600">Faster external markup integration</div>
            </div>
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-slate-900 mb-2">
                {auditCoverage.count}%
              </div>
              <div className="text-sm text-slate-600">Audit coverage on every action</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Section Header */}
          <div className="max-w-2xl mb-16">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Features
            </p>
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
              One platform for drafting, drift control, and golden records
            </h2>
            <p className="text-lg text-slate-600">
              Directly mapped to the backend schema: clauses, variables, graph nodes, drift items, reconciliation sessions, and audit events—no translation layers.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group p-8 rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Nexus-Sync Drafting</h3>
              <p className="text-slate-600 leading-relaxed">
                Extract clauses, bind financial variables, and enforce governance rules in real time. Every edit flows into the dependency graph automatically.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-8 rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Impact Map</h3>
              <p className="text-slate-600 leading-relaxed">
                Visual dependency graph across definitions, covenants, and calculations. See ripple effects before approving baseline changes.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-8 rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Commercial Drift Control</h3>
              <p className="text-slate-600 leading-relaxed">
                Monitor deviations from approved terms with severity, approvals, and export gating so risky drafts never reach downstream systems.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group p-8 rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">AI Reconciliation</h3>
              <p className="text-slate-600 leading-relaxed">
                Ingest DOCX/PDF markups from external counsel. Confidence-scored suggestions map straight into structured variables with auditability.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group p-8 rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Golden Record Export</h3>
              <p className="text-slate-600 leading-relaxed">
                Machine-readable JSON mapped to Prisma-backed models. Pre-built connectors for LoanIQ, Finastra, Allvue, and covenant trackers.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group p-8 rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Audit & Governance</h3>
              <p className="text-slate-600 leading-relaxed">
                Immutable audit events with RBAC-aligned visibility. Governance rules block edits that bypass credit or legal policy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 lg:py-32 bg-slate-900">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-20">
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
              How It Works
            </p>
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              From document to deal in three steps
            </h2>
          </div>

          {/* Steps */}
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-white text-slate-900 rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">Upload & Normalize</h3>
              <p className="text-slate-400 leading-relaxed">
                Drop DOCX/PDF agreements. We extract clauses, bind variables, and map everything to the dependency graph without manual re-keying.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-white text-slate-900 rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">Collaborate & Govern</h3>
              <p className="text-slate-400 leading-relaxed">
                Legal, risk, and operations work from the same data model. Resolve drift, capture reasons, and route approvals before publishing.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-white text-slate-900 rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">Publish Golden Record</h3>
              <p className="text-slate-400 leading-relaxed">
                Export governed data to servicing platforms with integrity gates and audit events. No drift, no missing approvals, no surprises.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Content */}
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Enterprise Security
              </p>
              <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
                Built for the most security-conscious institutions
              </h2>
              <p className="text-lg text-slate-600 mb-10">
                We understand that loan documentation contains sensitive financial data. That's why security isn't an afterthought—it's foundational.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">SOC 2 Type II Certified</h4>
                    <p className="text-slate-600">Independently audited security controls and processes.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">End-to-End Encryption</h4>
                    <p className="text-slate-600">AES-256 encryption at rest and TLS 1.3 in transit.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Role-Based Access Control</h4>
                    <p className="text-slate-600">Granular permissions ensure users see only what they need.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">99.99% Uptime SLA</h4>
                    <p className="text-slate-600">Enterprise-grade infrastructure with global redundancy.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual */}
            <div className="relative">
              <div className="aspect-square bg-slate-100 rounded-3xl p-12 flex items-center justify-center">
                <div className="w-full max-w-sm">
                  {/* Shield Icon */}
                  <div className="relative">
                    <svg className="w-full h-auto text-slate-200" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <svg className="w-1/2 h-auto text-slate-900 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-24 lg:py-32 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <svg className="w-12 h-12 text-slate-300 mx-auto mb-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
          </svg>
          <blockquote className="text-2xl lg:text-3xl font-medium text-slate-900 leading-relaxed mb-8">
            "LMA Nexus gave us a true digital twin of the facility agreement. External markups land in the graph in minutes, and export gating means downstream systems never see bad data."
          </blockquote>
          <div>
            <div className="font-semibold text-slate-900">Sarah Chen</div>
            <div className="text-slate-600">Head of Loan Operations, Global Banking Corp</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="bg-slate-900 rounded-3xl p-12 lg:p-20 text-center">
            <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
              Ready to ship golden-record loan docs with zero re-keying?
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
              Join teams replacing static PDFs with governed data models, drift control, and direct exports to servicing.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={handleGetStarted}
                className="w-full sm:w-auto bg-white text-slate-900 px-8 py-4 rounded-xl text-base font-semibold hover:bg-slate-100 transition-colors"
              >
                Get Started Free
              </button>
              <button className="w-full sm:w-auto text-white px-8 py-4 rounded-xl text-base font-semibold hover:bg-slate-800 transition-colors border border-slate-700">
                Schedule a Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
            {/* Brand */}
            <div className="col-span-2 lg:col-span-1">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">L</span>
                </div>
                <span className="text-xl font-semibold text-slate-900 tracking-tight">
                  LMA Nexus
                </span>
              </div>
              <p className="text-sm text-slate-600">
                Enterprise-grade syndicated loan documentation platform.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Product</h4>
              <ul className="space-y-3 text-sm text-slate-600">
                <li><a href="#features" className="hover:text-slate-900 transition-colors">Features</a></li>
                <li><a href="#security" className="hover:text-slate-900 transition-colors">Security</a></li>
                {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                <li><a href="#" className="hover:text-slate-900 transition-colors">Pricing</a></li>
                {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                <li><a href="#" className="hover:text-slate-900 transition-colors">Enterprise</a></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Resources</h4>
              <ul className="space-y-3 text-sm text-slate-600">
                {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                <li><a href="#" className="hover:text-slate-900 transition-colors">Documentation</a></li>
                {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                <li><a href="#" className="hover:text-slate-900 transition-colors">API Reference</a></li>
                {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                <li><a href="#" className="hover:text-slate-900 transition-colors">Blog</a></li>
                {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                <li><a href="#" className="hover:text-slate-900 transition-colors">Support</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Company</h4>
              <ul className="space-y-3 text-sm text-slate-600">
                {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                <li><a href="#" className="hover:text-slate-900 transition-colors">About</a></li>
                {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                <li><a href="#" className="hover:text-slate-900 transition-colors">Careers</a></li>
                <li><a href="#contact" className="hover:text-slate-900 transition-colors">Contact</a></li>
                {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                <li><a href="#" className="hover:text-slate-900 transition-colors">Partners</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Legal</h4>
              <ul className="space-y-3 text-sm text-slate-600">
                {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                <li><a href="#" className="hover:text-slate-900 transition-colors">Privacy Policy</a></li>
                {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                <li><a href="#" className="hover:text-slate-900 transition-colors">Terms of Service</a></li>
                {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                <li><a href="#" className="hover:text-slate-900 transition-colors">Cookie Policy</a></li>
                {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                <li><a href="#" className="hover:text-slate-900 transition-colors">GDPR</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-600">
              © 2026 LMA Nexus. All rights reserved.
            </p>
            <div className="flex items-center space-x-6">
              {/* Social Icons */}
              {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
              <a href="#" className="text-slate-400 hover:text-slate-600 transition-colors" aria-label="Twitter">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                </svg>
              </a>
              {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
              <a href="#" className="text-slate-400 hover:text-slate-600 transition-colors" aria-label="LinkedIn">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
              <a href="#" className="text-slate-400 hover:text-slate-600 transition-colors" aria-label="GitHub">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
