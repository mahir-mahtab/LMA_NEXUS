/**
 * PublicLayout Component
 * Centered content with minimal header for unauthenticated routes
 * Requirements: 13.5
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import { clsx } from 'clsx';
import ThemeToggle from '../../components/layout/ThemeToggle';

interface PublicLayoutProps {
  className?: string;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ className }) => {
  return (
    <div className={clsx(
      'min-h-screen flex flex-col md:flex-row bg-white dark:bg-slate-950 transition-colors duration-200',
      className
    )}>
      {/* Left Side - Visual/Branding */}
      <div className="hidden md:flex md:w-1/2 lg:w-5/12 bg-slate-900 dark:bg-slate-900 p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative elements (minimalist but vibrant) */}
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] border border-primary-500/30 rounded-full"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] border border-primary-400/20 rounded-full"></div>
          <div className="absolute top-[20%] right-[10%] w-20 h-20 bg-primary-600/10 blur-3xl rounded-full"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-12">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary-500/30">
              <span className="text-white font-bold text-lg">L</span>
            </div>
            <span className="text-2xl font-semibold tracking-tight text-white">
              LMA Nexus
            </span>
          </div>

          <div className="max-w-md">
            <h2 className="text-5xl font-bold text-white leading-tight mb-6">
              The standard for <br />
              <span className="text-primary-400">legal-financial</span> <br />
              documentation.
            </h2>
            <p className="text-xl text-slate-400 leading-relaxed">
              Streamline your workflow with enterprise-grade tools for drafting, reconciliation, and impact mapping.
            </p>
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center space-x-4">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] text-slate-400 font-medium">
                  U{i}
                </div>
              ))}
            </div>
            <p className="text-sm text-slate-500">
              Trusted by leading financial institutions and legal firms.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Content */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 md:px-12 lg:px-24 bg-slate-50 dark:bg-slate-950 relative">
        <div className="absolute top-8 right-8">
          <ThemeToggle />
        </div>
        
        <div className="w-full max-w-md mx-auto">
          <Outlet />
        </div>

        <div className="mt-auto pt-12 text-center md:text-left">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            © 2024 LMA Nexus. All rights reserved. <br className="md:hidden" />
            <span className="hidden md:inline"> • </span>
            Enterprise-grade security and compliance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublicLayout;