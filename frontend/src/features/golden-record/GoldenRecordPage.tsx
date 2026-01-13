/**
 * Golden Record Page
 * Export and publish structured deal data for downstream systems
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { 
  getGoldenRecord, 
  exportSchema, 
  publish, 
  canPublish
} from '../../services/goldenRecordService';
import { GoldenRecord, DownstreamConnector } from '../../types/golden-record';
import { ReasonCategory } from '../../types/audit';
import { useAuth } from '../../stores/AuthProvider';
import { usePermission } from '../../stores/PermissionProvider';
import { Button, Badge, Card, JsonViewer, Table, EmptyState, ConnectorCard } from '../../components/ui';
import { ReasonModal } from '../../components/feedback';
import { useToastHelpers } from '../../components/feedback/ToastContainer';

const GoldenRecordPage: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { session, user } = useAuth();
  const { can } = usePermission();
  const { success: showSuccess, error: showError } = useToastHelpers();

  const [goldenRecord, setGoldenRecord] = useState<GoldenRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishInfo, setPublishInfo] = useState<{
    allowed: boolean;
    reason?: string;
    integrityScore: number;
    unresolvedHighDriftCount: number;
  } | null>(null);

  // Modal states
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<'json' | 'covenants' | 'connectors'>('json');

  const reasonCategories: ReasonCategory[] = [
    'borrower_request',
    'market_conditions', 
    'credit_update',
    'legal_requirement',
    'other'
  ];

  // Stable reference for toast helpers to avoid re-render loops
  const toastHelpersRef = useRef({ showSuccess, showError });
  toastHelpersRef.current = { showSuccess, showError };

  // Load golden record data
  const loadData = useCallback(async () => {
    if (!workspaceId) return;
    
    setLoading(true);
    try {
      const [recordResult, publishResult] = await Promise.all([
        getGoldenRecord(workspaceId),
        canPublish(workspaceId)
      ]);

      if (recordResult.success && recordResult.goldenRecord) {
        setGoldenRecord(recordResult.goldenRecord);
      } else {
        toastHelpersRef.current.showError('Failed to load golden record');
      }

      setPublishInfo(publishResult);
    } catch (error) {
      console.error('Error loading golden record:', error);
      toastHelpersRef.current.showError('Failed to load golden record');
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle export JSON
  const handleExport = async () => {
    if (!workspaceId || !session || !user) return;

    setIsExporting(true);
    try {
      const result = await exportSchema(workspaceId, session.userId, user.name);
      
      if (result.success && result.schemaJson && result.filename) {
        // Create download
        const blob = new Blob([result.schemaJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showSuccess('Golden record exported successfully');
        
        // Refresh data to update lastExportAt
        const recordResult = await getGoldenRecord(workspaceId);
        if (recordResult.success && recordResult.goldenRecord) {
          setGoldenRecord(recordResult.goldenRecord);
        }
      } else {
        showError(result.error?.message || 'Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      showError('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle connector test result
  const handleConnectorTest = (connector: DownstreamConnector, result: { success: boolean; message: string }) => {
    if (result.success) {
      showSuccess(`Connection to ${connector.name} successful`);
    } else {
      showError(`Connection to ${connector.name} failed: ${result.message}`);
    }
  };
  const handlePublish = async (reason: string, category: ReasonCategory) => {
    if (!workspaceId || !session || !user) return;

    setIsPublishing(true);
    try {
      const result = await publish(workspaceId, reason, session.userId, user.name, category);
      
      if (result.success && result.goldenRecord) {
        setGoldenRecord(result.goldenRecord);
        showSuccess('Golden record published successfully');
        
        // Refresh publish info
        const publishResult = await canPublish(workspaceId);
        setPublishInfo(publishResult);
      } else {
        showError(result.error?.message || 'Publish failed');
      }
    } catch (error) {
      console.error('Publish error:', error);
      showError('Publish failed');
    } finally {
      setIsPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-full bg-slate-50 dark:bg-slate-950 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse"></div>
              <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse"></div>
            </div>
            <div className="flex gap-3">
              <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse"></div>
              <div className="h-10 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse"></div>
            </div>
          </div>
          
          {/* Status Card Skeleton */}
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
          
          {/* Tabs Skeleton */}
          <div className="flex gap-8 border-b border-slate-200 dark:border-slate-800">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse"></div>
            ))}
          </div>
          
          {/* Content Skeleton */}
          <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!goldenRecord) {
    return (
      <div className="min-h-full bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Golden Record Not Found
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Unable to load golden record data.
          </p>
        </div>
      </div>
    );
  }

  const canExport = can('golden:export');
  const canPublishRecord = can('golden:publish');
  const publishAllowed = publishInfo?.allowed && canPublishRecord;

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Golden Record
            </h1>
            <span className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider ${
              goldenRecord.status === 'READY'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'
            }`}>
              {goldenRecord.status === 'READY' ? 'Ready' : 'In Review'}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            {canExport && (
              <Button
                variant="secondary"
                onClick={handleExport}
                loading={isExporting}
                disabled={isExporting}
                className="h-10 px-5 rounded-xl font-bold text-xs"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export JSON
              </Button>
            )}
            
            {canPublishRecord && (
              <Button
                variant="primary"
                onClick={() => setShowPublishModal(true)}
                disabled={!publishAllowed || isPublishing}
                tooltip={!publishAllowed ? publishInfo?.reason : undefined}
                className="h-10 px-5 rounded-xl font-bold text-xs shadow-lg shadow-primary-500/20"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Publish
              </Button>
            )}
          </div>
        </div>

        {/* Status Info */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <div className={`text-3xl font-extrabold ${
                goldenRecord.integrityScore >= 90 
                  ? 'text-emerald-600 dark:text-emerald-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {goldenRecord.integrityScore}%
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                Network Integrity
              </div>
              {goldenRecord.integrityScore < 90 && (
                <div className="text-[10px] text-red-600 dark:text-red-400 mt-1 font-medium">
                  Minimum 90% required
                </div>
              )}
            </div>
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <div className={`text-3xl font-extrabold ${
                goldenRecord.unresolvedHighDriftCount === 0 
                  ? 'text-emerald-600 dark:text-emerald-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {goldenRecord.unresolvedHighDriftCount}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                High Drift Items
              </div>
              {goldenRecord.unresolvedHighDriftCount > 0 && (
                <div className="text-[10px] text-red-600 dark:text-red-400 mt-1 font-medium">
                  Must be resolved
                </div>
              )}
            </div>
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {goldenRecord.connectors.length}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                Downstream Systems
              </div>
            </div>
          </div>
          
          {/* Publish Status Indicator */}
          {!publishAllowed && publishInfo?.reason && (
            <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm font-bold text-amber-800 dark:text-amber-200">
                  Publishing Blocked: {publishInfo.reason}
                </span>
              </div>
            </div>
          )}
          
          {goldenRecord.lastPublishAt && (
            <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Last Published: <span className="font-bold text-slate-700 dark:text-slate-300">{new Date(goldenRecord.lastPublishAt).toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="border-b border-slate-100 dark:border-slate-800 px-5">
            <nav className="-mb-px flex space-x-6">
              {[
                { key: 'json', label: 'Structured JSON', icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                )},
                { key: 'covenants', label: 'Covenant Table', icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                )},
                { key: 'connectors', label: 'Downstream Destinations', icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-bold text-sm transition-colors ${
                    activeTab === tab.key
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-5">
            {activeTab === 'json' && (
              <JsonViewer
                data={goldenRecord.schemaJson}
                title="Golden Record Schema"
                filename={`golden_record_${new Date().toISOString().split('T')[0]}.json`}
                maxHeight="600px"
              />
            )}
            
            {activeTab === 'covenants' && (
              <>
                {goldenRecord.covenants.length > 0 ? (
                  <Table
                    columns={[
                      { key: 'name', header: 'Covenant Name' },
                      { key: 'testFrequency', header: 'Test Frequency' },
                      { key: 'threshold', header: 'Threshold' },
                      { key: 'calculationBasis', header: 'Calculation Basis' },
                      { key: 'clauseRef', header: 'Clause Reference' }
                    ]}
                    data={goldenRecord.covenants.map(covenant => ({
                      name: covenant.name,
                      testFrequency: covenant.testFrequency,
                      threshold: covenant.threshold,
                      calculationBasis: covenant.calculationBasis,
                      clauseRef: (
                        <button
                          className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 underline font-bold text-xs"
                          onClick={() => {
                            // Navigate to drafting page with clause selected
                            window.location.href = `/app/workspaces/${workspaceId}/drafting?clauseId=${covenant.clauseId}`;
                          }}
                        >
                          View Clause
                        </button>
                      )
                    }))}
                    emptyState={
                      <EmptyState
                        title="No Covenants"
                        description="No covenants have been defined for this workspace."
                      />
                    }
                  />
                ) : (
                  <EmptyState
                    title="No Covenants"
                    description="No covenants have been defined for this workspace."
                  />
                )}
              </>
            )}
            
            {activeTab === 'connectors' && (
              <>
                {goldenRecord.connectors.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {goldenRecord.connectors.map((connector) => (
                      <ConnectorCard
                        key={connector.id}
                        connector={connector}
                        onTestConnection={handleConnectorTest}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No Downstream Connectors"
                    description="No downstream systems have been configured for this workspace."
                  />
                )}
              </>
            )}
          </div>
        </div>

        {/* Publish Modal */}
        <ReasonModal
          isOpen={showPublishModal}
          title="Publish Golden Record"
          reasonCategories={reasonCategories}
          onSubmit={handlePublish}
          onCancel={() => setShowPublishModal(false)}
          submitText="Publish"
          reasonLabel="Reason for Publishing"
          reasonPlaceholder="Please provide a reason for publishing the golden record to downstream systems..."
          isSubmitting={isPublishing}
        />
      </div>
    </div>
  );
};

export default GoldenRecordPage;