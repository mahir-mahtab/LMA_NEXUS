/**
 * AI Reconciliation Page
 * Upload external markups and map suggested changes
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui';
import { ReasonModal } from '../../components/feedback';
import { ReconciliationCard, ReconciliationSummary } from '../../components/reconciliation';
import { useWorkspace } from '../../stores/WorkspaceProvider';
import { useAuth } from '../../stores/AuthProvider';
import { usePermission } from '../../stores/PermissionProvider';
import { useToastHelpers } from '../../components/feedback/ToastContainer';
import { ReconciliationItem, ReconciliationSession } from '../../types/reconciliation';
import { ReasonCategory } from '../../types/audit';
import * as reconciliationService from '../../services/reconciliationService';
import * as draftService from '../../services/draftService';

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error';

const AIReconciliationPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeWorkspaceId } = useWorkspace();
  const { user } = useAuth();
  const { can } = usePermission();
  const { success, error: showError } = useToastHelpers();
  
  // Upload state
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reconciliation state
  const [sessions, setSessions] = useState<ReconciliationSession[]>([]);
  const [activeSession, setActiveSession] = useState<ReconciliationSession | null>(null);
  const [items, setItems] = useState<ReconciliationItem[]>([]);
  const [clauses, setClauses] = useState<Record<string, { title: string }>>({});
  const [variables, setVariables] = useState<Record<string, { label: string }>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Action state
  const [reasonModal, setReasonModal] = useState<{
    isOpen: boolean;
    type: 'apply' | 'reject' | 'applyAll' | null;
    itemId: string | null;
    itemIds?: string[];
  }>({
    isOpen: false,
    type: null,
    itemId: null,
    itemIds: []
  });
  const [processingItems, setProcessingItems] = useState<Set<string>>(new Set());
  const [isApplyingAll, setIsApplyingAll] = useState(false);

  // Check permissions
  const canUpload = can('recon:upload');
  const canApplyReject = can('recon:applyReject');

  // Load sessions and active session data
  const loadSessions = useCallback(async () => {
    if (!activeWorkspaceId) return;
    
    try {
      const sessionList = await reconciliationService.listSessions(activeWorkspaceId);
      setSessions(sessionList);
      
      // Auto-select the most recent session if none selected
      if (!activeSession && sessionList.length > 0) {
        setActiveSession(sessionList[0]);
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }
  }, [activeWorkspaceId, activeSession]);

  const loadSessionItems = useCallback(async () => {
    if (!activeSession) return;
    
    setIsLoading(true);
    try {
      const sessionItems = await reconciliationService.listReconciliationItems(
        activeSession.workspaceId,
        activeSession.id
      );
      setItems(sessionItems);
    } catch (err) {
      console.error('Failed to load session items:', err);
      showError('Failed to load reconciliation items');
    } finally {
      setIsLoading(false);
    }
  }, [activeSession, showError]);

  const loadClauseAndVariableData = useCallback(async () => {
    if (!activeWorkspaceId) return;
    
    try {
      const outline = await draftService.getDocumentOutline(activeWorkspaceId);
      const clauseMap: Record<string, { title: string }> = {};
      outline.forEach(clause => {
        clauseMap[clause.id] = { title: clause.title };
      });
      setClauses(clauseMap);
      setVariables({});
    } catch (err) {
      console.error('Failed to load clause/variable data:', err);
    }
  }, [activeWorkspaceId]);

  useEffect(() => {
    if (activeWorkspaceId) {
      loadSessions();
    }
  }, [activeWorkspaceId, loadSessions]);

  useEffect(() => {
    if (activeSession) {
      loadSessionItems();
      loadClauseAndVariableData();
    }
  }, [activeSession, loadClauseAndVariableData, loadSessionItems]);

  const handleFileSelect = useCallback((file: File) => {
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const allowedExtensions = ['.pdf', '.docx'];
    
    const isValidType = allowedTypes.includes(file.type) || 
      allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    
    if (!isValidType) {
      setError('Please select a PDF or DOCX file');
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setError(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleUpload = useCallback(async () => {
    if (!selectedFile || !activeWorkspaceId || !user || !canUpload) return;

    setUploadStatus('uploading');
    setError(null);

    try {
      setUploadStatus('processing');
      
      const result = await reconciliationService.uploadDirtyDraft(
        {
          workspaceId: activeWorkspaceId,
          file: selectedFile
        },
        user.id,
        user.name
      );

      if (result.success && result.session && result.items) {
        setUploadStatus('success');
        success(
          'Document uploaded successfully',
          `Found ${result.items.length} reconciliation suggestions`
        );
        
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        await loadSessions();
        setActiveSession(result.session);
      } else {
        setUploadStatus('error');
        setError(result.error?.message || 'Upload failed');
        showError('Upload failed', result.error?.message);
      }
    } catch (err) {
      setUploadStatus('error');
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      showError('Upload failed', errorMessage);
    }
  }, [selectedFile, activeWorkspaceId, user, canUpload, success, showError, loadSessions]);

  const handleClear = useCallback(() => {
    setSelectedFile(null);
    setError(null);
    setUploadStatus('idle');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleApplyClick = useCallback((itemId: string) => {
    setReasonModal({
      isOpen: true,
      type: 'apply',
      itemId,
      itemIds: []
    });
  }, []);

  const handleRejectClick = useCallback((itemId: string) => {
    setReasonModal({
      isOpen: true,
      type: 'reject',
      itemId,
      itemIds: []
    });
  }, []);

  const handleApplyAllHighConfidence = useCallback(() => {
    const highConfidenceItems = items.filter(item => 
      item.decision === 'pending' && item.confidence === 'HIGH'
    );
    
    if (highConfidenceItems.length === 0) return;

    setReasonModal({
      isOpen: true,
      type: 'applyAll',
      itemId: null,
      itemIds: highConfidenceItems.map(item => item.id)
    });
  }, [items]);

  const handleReasonSubmit = useCallback(async (reason: string, category: ReasonCategory) => {
    const { type, itemId, itemIds } = reasonModal;
    if (!type || !user) return;

    if (type === 'applyAll' && itemIds && itemIds.length > 0) {
      setIsApplyingAll(true);
      setProcessingItems(prev => new Set([...Array.from(prev), ...itemIds]));

      try {
        let successCount = 0;
        let failureCount = 0;

        for (const id of itemIds) {
          try {
            const result = await reconciliationService.applySuggestion(
              { itemId: id, reason, reasonCategory: category },
              user.id,
              user.name
            );
            
            if (result.success) {
              successCount++;
            } else {
              failureCount++;
            }
          } catch (err) {
            failureCount++;
          }
        }

        if (successCount > 0) {
          success(
            `Applied ${successCount} high-confidence suggestions`,
            failureCount > 0 ? `${failureCount} suggestions failed to apply` : 'All changes applied successfully'
          );
        }

        if (failureCount > 0 && successCount === 0) {
          showError('Failed to apply suggestions', 'All suggestions failed to apply');
        }

        await loadSessions();
        await loadSessionItems();
      } catch (err) {
        showError('Failed to apply suggestions', 'An unexpected error occurred');
      } finally {
        setIsApplyingAll(false);
        setProcessingItems(prev => {
          const next = new Set(Array.from(prev));
          itemIds.forEach(id => next.delete(id));
          return next;
        });
      }
    } else if (itemId) {
      setProcessingItems(prev => new Set(Array.from(prev)).add(itemId));

      try {
        let result;
        if (type === 'apply') {
          result = await reconciliationService.applySuggestion(
            { itemId, reason, reasonCategory: category },
            user.id,
            user.name
          );
        } else {
          result = await reconciliationService.rejectSuggestion(
            { itemId, reason, reasonCategory: category },
            user.id,
            user.name
          );
        }

        if (result.success) {
          success(
            `Suggestion ${type}d successfully`,
            type === 'apply' ? 'Changes have been applied and graph/drift updated' : undefined
          );
          
          await loadSessions();
          await loadSessionItems();
        } else {
          showError(`Failed to ${type} suggestion`, result.error?.message);
        }
      } catch (err) {
        showError(`Failed to ${type} suggestion`, 'An unexpected error occurred');
      } finally {
        setProcessingItems(prev => {
          const next = new Set(Array.from(prev));
          next.delete(itemId);
          return next;
        });
      }
    }
  }, [reasonModal, user, success, showError, loadSessions, loadSessionItems]);

  const handleReasonCancel = useCallback(() => {
    setReasonModal({
      isOpen: false,
      type: null,
      itemId: null,
      itemIds: []
    });
  }, []);

  const handleNavigateToDrafting = useCallback(() => {
    navigate(`/app/workspaces/${activeWorkspaceId}/drafting`);
  }, [navigate, activeWorkspaceId]);

  const handleNavigateToGraph = useCallback(() => {
    navigate(`/app/workspaces/${activeWorkspaceId}/impact-map`);
  }, [navigate, activeWorkspaceId]);

  const handleNavigateToDrift = useCallback(() => {
    navigate(`/app/workspaces/${activeWorkspaceId}/commercial-drift`);
  }, [navigate, activeWorkspaceId]);

  const reasonCategories: ReasonCategory[] = [
    'borrower_request',
    'market_conditions',
    'credit_update',
    'legal_requirement',
    'other'
  ];

  if (!canUpload && !canApplyReject) {
    return (
      <div className="min-h-full bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Access Denied
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            You don't have permission to access reconciliation features.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            AI Reconciliation
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Upload external markups and map suggested changes to your document
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column - Upload Panel */}
          <div className="space-y-6 lg:col-span-2">
            {/* Upload Panel */}
            {canUpload && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                  Upload Document
                </h2>
                
                {/* Dropzone */}
                <div
                  className={`
                    relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200
                    ${isDragOver 
                      ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20' 
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }
                    ${uploadStatus === 'uploading' || uploadStatus === 'processing' ? 'pointer-events-none opacity-50' : ''}
                  `}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx"
                    onChange={handleFileInputChange}
                    className="hidden"
                    disabled={uploadStatus === 'uploading' || uploadStatus === 'processing'}
                  />
                  
                  <div className="space-y-4">
                    {/* Upload Icon */}
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    
                    {selectedFile ? (
                      <div className="space-y-2">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          Selected file:
                        </p>
                        <div className="flex items-center justify-center space-x-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl inline-flex">
                          <svg className="w-5 h-5 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {selectedFile.name}
                          </span>
                          <span className="text-xs text-slate-500">
                            ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-slate-600 dark:text-slate-400">
                          Drop your document here, or{' '}
                          <button
                            type="button"
                            onClick={handleBrowseClick}
                            className="font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                            disabled={uploadStatus === 'uploading' || uploadStatus === 'processing'}
                          >
                            browse
                          </button>
                        </p>
                        <p className="text-xs text-slate-400">
                          Supports PDF and DOCX files up to 10MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm font-medium text-red-700 dark:text-red-200">
                        {error}
                      </p>
                    </div>
                  </div>
                )}

                {/* Status Indicator */}
                {(uploadStatus === 'uploading' || uploadStatus === 'processing') && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-600 animate-spin dark:text-blue-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <p className="text-sm font-bold text-blue-700 dark:text-blue-200">
                        {uploadStatus === 'uploading' ? 'Uploading document...' : 'Processing document and generating suggestions...'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end mt-5 space-x-3">
                  {selectedFile && (
                    <Button
                      variant="secondary"
                      onClick={handleClear}
                      disabled={uploadStatus === 'uploading' || uploadStatus === 'processing'}
                      className="h-10 px-5 rounded-xl font-bold text-xs"
                    >
                      Clear
                    </Button>
                  )}
                  <Button
                    variant="primary"
                    onClick={handleUpload}
                    disabled={!selectedFile || uploadStatus === 'uploading' || uploadStatus === 'processing'}
                    loading={uploadStatus === 'uploading' || uploadStatus === 'processing'}
                    className="h-10 px-5 rounded-xl font-bold text-xs shadow-lg shadow-primary-500/20"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload & Parse
                  </Button>
                </div>
              </div>
            )}

            {/* Reconciliation Items */}
            {activeSession && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Reconciliation Suggestions
                  </h2>
                  <div className="flex items-center space-x-3">
                    {/* Apply All High-Confidence Button */}
                    {canApplyReject && items.some(item => item.decision === 'pending' && item.confidence === 'HIGH') && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleApplyAllHighConfidence}
                        disabled={isApplyingAll}
                        loading={isApplyingAll}
                        className="h-9 px-4 rounded-xl font-bold text-xs shadow-lg shadow-primary-500/20"
                      >
                        Apply All High-Confidence
                      </Button>
                    )}
                    
                    {/* Session Selector */}
                    {sessions.length > 1 && (
                      <select
                        value={activeSession.id}
                        onChange={(e) => {
                          const session = sessions.find(s => s.id === e.target.value);
                          if (session) setActiveSession(session);
                        }}
                        className="px-3 py-2 text-sm font-medium text-slate-900 bg-white border border-slate-200 rounded-xl dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      >
                        {sessions.map(session => (
                          <option key={session.id} value={session.id}>
                            {session.fileName} ({new Date(session.uploadedAt).toLocaleDateString()})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-48 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
                    ))}
                  </div>
                ) : items.length > 0 ? (
                  <div className="space-y-4">
                    {items.map(item => (
                      <ReconciliationCard
                        key={item.id}
                        item={item}
                        clauseTitle={clauses[item.targetClauseId]?.title}
                        variableLabel={item.targetVariableId ? variables[item.targetVariableId]?.label : undefined}
                        onApply={handleApplyClick}
                        onReject={handleRejectClick}
                        isApplying={processingItems.has(item.id) && reasonModal.type === 'apply'}
                        isRejecting={processingItems.has(item.id) && reasonModal.type === 'reject'}
                        canApplyReject={canApplyReject}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12">
                    <div className="text-center max-w-md mx-auto">
                      <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                        No suggestions found
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400">
                        This session doesn't contain any reconciliation suggestions.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Summary Panel */}
          <div className="space-y-6">
            {activeSession && (
              <ReconciliationSummary
                session={activeSession}
                hasHighImpactChanges={items.some(item => 
                  item.decision === 'applied' && 
                  (item.confidence === 'HIGH' || parseFloat(item.proposedValue) !== parseFloat(item.currentValue))
                )}
                onNavigateToDrafting={handleNavigateToDrafting}
                onNavigateToGraph={handleNavigateToGraph}
                onNavigateToDrift={handleNavigateToDrift}
              />
            )}
          </div>
        </div>

        {/* Reason Modal */}
        <ReasonModal
          isOpen={reasonModal.isOpen}
          title={
            reasonModal.type === 'apply' ? 'Apply Suggestion' :
            reasonModal.type === 'reject' ? 'Reject Suggestion' :
            reasonModal.type === 'applyAll' ? `Apply ${reasonModal.itemIds?.length || 0} High-Confidence Suggestions` :
            'Action Required'
          }
          reasonCategories={reasonCategories}
          onSubmit={handleReasonSubmit}
          onCancel={handleReasonCancel}
          submitText={
            reasonModal.type === 'apply' ? 'Apply' :
            reasonModal.type === 'reject' ? 'Reject' :
            reasonModal.type === 'applyAll' ? 'Apply All' :
            'Confirm'
          }
          reasonPlaceholder={
            reasonModal.type === 'apply' 
              ? 'Please explain why this suggestion should be applied...'
              : reasonModal.type === 'reject'
              ? 'Please explain why this suggestion should be rejected...'
              : reasonModal.type === 'applyAll'
              ? 'Please explain why these high-confidence suggestions should be applied...'
              : 'Please provide a reason...'
          }
          isSubmitting={
            reasonModal.type === 'applyAll' ? isApplyingAll :
            reasonModal.itemId ? processingItems.has(reasonModal.itemId) : false
          }
        />
      </div>
    </div>
  );
};

export default AIReconciliationPage;