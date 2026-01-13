/**
 * Audit Export Component
 * Handles exporting audit events to CSV/JSON formats
 * Requirements: 11.4
 */

import React, { useState } from 'react';
import Button from '../ui/Button';
import Select from '../ui/Select';
import { useAudit } from '../../stores/AuditProvider';
import { useAuth } from '../../stores/AuthProvider';
import { usePermission } from '../../stores/PermissionProvider';

export interface AuditExportProps {
  className?: string;
}

const AuditExport: React.FC<AuditExportProps> = ({ className = '' }) => {
  const { exportAudit } = useAudit();
  const { session } = useAuth();
  const { can } = usePermission();
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');

  // Check if user can export audit
  const canExport = can('audit:export');

  const handleExport = async () => {
    if (!session || !canExport) return;

    setIsExporting(true);
    
    try {
      const result = await exportAudit(exportFormat);
      
      if (result.success && result.data && result.filename) {
        // Create and trigger download
        const blob = new Blob([result.data], {
          type: exportFormat === 'json' ? 'application/json' : 'text/csv',
        });
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        throw new Error(result.error || 'Export failed');
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert(error instanceof Error ? error.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  if (!canExport) {
    return null;
  }

  const formatOptions = [
    { value: 'json', label: 'JSON' },
    { value: 'csv', label: 'CSV' },
  ];

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className="min-w-24">
        <Select
          value={exportFormat}
          onChange={(e) => setExportFormat(e.target.value as 'json' | 'csv')}
          options={formatOptions}
          className="text-sm rounded-xl border-slate-200 dark:border-slate-700"
        />
      </div>
      
      <Button
        variant="secondary"
        size="sm"
        onClick={handleExport}
        loading={isExporting}
        disabled={isExporting}
        className="h-10 px-5 rounded-xl font-bold text-xs whitespace-nowrap"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        {isExporting ? 'Exporting...' : `Export ${exportFormat.toUpperCase()}`}
      </Button>
    </div>
  );
};

export default AuditExport;