/**
 * ConnectorCard Component
 * Displays downstream connector information with status and actions
 * Requirements: 9.6
 */

import React, { useState } from 'react';
import { DownstreamConnector } from '../../types/golden-record';
import { testConnection } from '../../services/goldenRecordService';
import { Button, Badge, Card } from './';

export interface ConnectorCardProps {
  connector: DownstreamConnector;
  onTestConnection?: (connector: DownstreamConnector, result: { success: boolean; message: string }) => void;
}

const ConnectorCard: React.FC<ConnectorCardProps> = ({
  connector,
  onTestConnection
}) => {
  const [testing, setTesting] = useState(false);
  const [lastTestResult, setLastTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const result = await testConnection(connector.id);
      setLastTestResult(result);
      onTestConnection?.(connector, result);
    } catch (error) {
      const errorResult = { success: false, message: 'Connection test failed' };
      setLastTestResult(errorResult);
      onTestConnection?.(connector, errorResult);
    } finally {
      setTesting(false);
    }
  };

  const getConnectorIcon = (type: DownstreamConnector['type']) => {
    const iconClass = "w-8 h-8 text-gray-600 dark:text-gray-400";
    
    switch (type) {
      case 'LoanIQ':
        return (
          <div className={`${iconClass} bg-blue-100 dark:bg-blue-900 rounded-lg p-1.5 flex items-center justify-center`}>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">LIQ</span>
          </div>
        );
      case 'Finastra':
        return (
          <div className={`${iconClass} bg-green-100 dark:bg-green-900 rounded-lg p-1.5 flex items-center justify-center`}>
            <span className="text-xs font-bold text-green-600 dark:text-green-400">FIN</span>
          </div>
        );
      case 'Allvue':
        return (
          <div className={`${iconClass} bg-purple-100 dark:bg-purple-900 rounded-lg p-1.5 flex items-center justify-center`}>
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400">ALL</span>
          </div>
        );
      case 'CovenantTracker':
        return (
          <div className={`${iconClass} bg-orange-100 dark:bg-orange-900 rounded-lg p-1.5 flex items-center justify-center`}>
            <span className="text-xs font-bold text-orange-600 dark:text-orange-400">COV</span>
          </div>
        );
      default:
        return (
          <div className={`${iconClass} bg-gray-100 dark:bg-gray-800 rounded-lg p-1.5 flex items-center justify-center`}>
            <svg fill="currentColor" viewBox="0 0 20 20" className="w-4 h-4">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
            </svg>
          </div>
        );
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {getConnectorIcon(connector.type)}
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">
              {connector.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {connector.type}
            </p>
          </div>
        </div>
        
        <Badge variant="status" value={connector.status} />
      </div>

      <div className="mt-4 space-y-2">
        {connector.lastSyncAt && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">Last Sync:</span>{' '}
            {new Date(connector.lastSyncAt).toLocaleString()}
          </div>
        )}
        
        {lastTestResult && (
          <div className={`text-sm ${
            lastTestResult.success 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-red-600 dark:text-red-400'
          }`}>
            <span className="font-medium">Test Result:</span>{' '}
            {lastTestResult.message}
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleTestConnection}
          loading={testing}
          disabled={testing}
          className="w-full"
        >
          {testing ? 'Testing...' : 'Test Connection'}
        </Button>
      </div>
    </Card>
  );
};

export default ConnectorCard;