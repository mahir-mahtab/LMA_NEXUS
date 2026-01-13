/**
 * JsonViewer Component
 * Displays formatted JSON with syntax highlighting and copy/download functionality
 * Requirements: 9.2
 */

import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Button } from './';

export interface JsonViewerProps {
  data: string | object;
  className?: string;
  maxHeight?: string;
  showCopy?: boolean;
  showDownload?: boolean;
  filename?: string;
  title?: string;
}

const JsonViewer: React.FC<JsonViewerProps> = ({
  data,
  className,
  maxHeight = '400px',
  showCopy = true,
  showDownload = true,
  filename = 'data.json',
  title
}) => {
  const [copied, setCopied] = useState(false);

  // Convert data to formatted JSON string
  const jsonString = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

  // Handle copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  // Handle download
  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Simple syntax highlighting for JSON
  const highlightJson = (json: string) => {
    return json
      .replace(/(".*?")\s*:/g, '<span class="text-blue-600 dark:text-blue-400">$1</span>:')
      .replace(/:\s*(".*?")/g, ': <span class="text-green-600 dark:text-green-400">$1</span>')
      .replace(/:\s*(true|false)/g, ': <span class="text-purple-600 dark:text-purple-400">$1</span>')
      .replace(/:\s*(null)/g, ': <span class="text-gray-500 dark:text-gray-400">$1</span>')
      .replace(/:\s*(\d+\.?\d*)/g, ': <span class="text-orange-600 dark:text-orange-400">$1</span>');
  };

  return (
    <div className={clsx('bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700', className)}>
      {/* Header */}
      {(title || showCopy || showDownload) && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
          {title && (
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {title}
            </h3>
          )}
          
          <div className="flex items-center gap-2">
            {showCopy && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="text-gray-600 dark:text-gray-400"
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Copied
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </>
                )}
              </Button>
            )}
            
            {showDownload && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                className="text-gray-600 dark:text-gray-400"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download
              </Button>
            )}
          </div>
        </div>
      )}

      {/* JSON Content */}
      <div 
        className="p-4 overflow-auto font-mono text-sm"
        style={{ maxHeight }}
      >
        <pre 
          className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words"
          dangerouslySetInnerHTML={{ __html: highlightJson(jsonString) }}
        />
      </div>
    </div>
  );
};

export default JsonViewer;