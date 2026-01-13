/**
 * SplitPaneLayout - Three-column layout for drafting page
 * Requirements: 4.1
 */

import React from 'react';

interface SplitPaneLayoutProps {
  outline: React.ReactNode;
  editor: React.ReactNode;
  inspector: React.ReactNode;
  outlineWidth?: string;
  inspectorWidth?: string;
}

const SplitPaneLayout: React.FC<SplitPaneLayoutProps> = ({
  outline,
  editor,
  inspector,
  outlineWidth = '320px',
  inspectorWidth = '320px',
}) => {
  return (
    <div className="flex h-full bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Outline Panel */}
      <div 
        className="flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        style={{ width: outlineWidth }}
      >
        {outline}
      </div>

      {/* Editor Panel */}
      <div className="flex-1 min-w-0 bg-white dark:bg-slate-900">
        {editor}
      </div>

      {/* Inspector Panel */}
      <div 
        className="flex-shrink-0 border-l border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
        style={{ width: inspectorWidth }}
      >
        {inspector}
      </div>
    </div>
  );
};

export default SplitPaneLayout;