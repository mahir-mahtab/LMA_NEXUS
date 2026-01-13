/**
 * Commercial Drift Page
 * Displays drift items with filtering, override baseline, and revert draft actions
 * Requirements: 7.1, 7.2, 7.4, 7.5, 7.6
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { DriftCard, DriftFilterBar, DriftFilters } from '../../components/drift';
import { ReasonModal } from '../../components/feedback';
import { EmptyState, LoadingSkeleton, Button } from '../../components/ui';
import { useWorkspace } from '../../stores/WorkspaceProvider';
import { useAuth } from '../../stores/AuthProvider';
import { usePermission } from '../../stores/PermissionProvider';
import { DriftItem } from '../../types/drift';
import { ReasonCategory } from '../../types/audit';
import * as driftService from '../../services/driftService';

const CommercialDriftPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeWorkspaceId } = useWorkspace();
  const { can } = usePermission();

  // State
  const [driftItems, setDriftItems] = useState<DriftItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<DriftItem[]>([]);
  const [filters, setFilters] = useState<DriftFilters>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [overrideModal, setOverrideModal] = useState<{
    isOpen: boolean;
    driftId: string | null;
    isSubmitting: boolean;
  }>({
    isOpen: false,
    driftId: null,
    isSubmitting: false,
  });

  const [revertModal, setRevertModal] = useState<{
    isOpen: boolean;
    driftId: string | null;
    isSubmitting: boolean;
  }>({
    isOpen: false,
    driftId: null,
    isSubmitting: false,
  });

  const [approveModal, setApproveModal] = useState<{
    isOpen: boolean;
    driftId: string | null;
    isSubmitting: boolean;
  }>({
    isOpen: false,
    driftId: null,
    isSubmitting: false,
  });

  // Permissions
  const canOverrideBaseline = can('drift:overrideBaseline');
  const canRevertDraft = can('drift:revertDraft');
  const canApproveDrift = can('drift:approve');

  // Load drift items
  const loadDriftItems = useCallback(async () => {
    if (!activeWorkspaceId) return;

    setIsLoading(true);
    setError(null);

    try {
      const items = await driftService.listDrift({
        workspaceId: activeWorkspaceId,
        ...filters,
      });
      setDriftItems(items);
    } catch (err) {
      console.error('Failed to load drift items:', err);
      setError('Failed to load drift items');
    } finally {
      setIsLoading(false);
    }
  }, [activeWorkspaceId, filters]);

  // Load data on mount and when filters change
  useEffect(() => {
    loadDriftItems();
  }, [loadDriftItems]);

  // Apply client-side filtering for better UX
  useEffect(() => {
    let filtered = [...driftItems];

    if (filters.severity) {
      filtered = filtered.filter(item => item.severity === filters.severity);
    }

    if (filters.type) {
      filtered = filtered.filter(item => item.type === filters.type);
    }

    if (filters.status) {
      filtered = filtered.filter(item => item.status === filters.status);
    }

    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase();
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(keyword) ||
        item.baselineValue.toLowerCase().includes(keyword) ||
        item.currentValue.toLowerCase().includes(keyword)
      );
    }

    setFilteredItems(filtered);
  }, [driftItems, filters]);

  // Handle override baseline
  const handleOverrideBaseline = (driftId: string) => {
    setOverrideModal({
      isOpen: true,
      driftId,
      isSubmitting: false,
    });
  };

  const handleOverrideSubmit = async (reason: string, category: ReasonCategory) => {
    if (!overrideModal.driftId || !user) return;

    setOverrideModal(prev => ({ ...prev, isSubmitting: true }));

    try {
      const result = await driftService.overrideBaseline(
        {
          driftId: overrideModal.driftId,
          reason,
          reasonCategory: category,
        },
        user.id,
        user.name
      );

      if (result.success) {
        // Refresh drift items
        await loadDriftItems();
        setOverrideModal({ isOpen: false, driftId: null, isSubmitting: false });
      } else {
        setError(result.error?.message || 'Failed to override baseline');
        setOverrideModal(prev => ({ ...prev, isSubmitting: false }));
      }
    } catch (err) {
      console.error('Override baseline error:', err);
      setError('An unexpected error occurred');
      setOverrideModal(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const handleOverrideCancel = () => {
    setOverrideModal({ isOpen: false, driftId: null, isSubmitting: false });
  };

  // Handle revert draft
  const handleRevertDraft = (driftId: string) => {
    setRevertModal({
      isOpen: true,
      driftId,
      isSubmitting: false,
    });
  };

  const handleRevertSubmit = async (reason: string, category: ReasonCategory) => {
    if (!revertModal.driftId || !user) return;

    setRevertModal(prev => ({ ...prev, isSubmitting: true }));

    try {
      const result = await driftService.revertDraft(
        {
          driftId: revertModal.driftId,
          reason,
          reasonCategory: category,
        },
        user.id,
        user.name
      );

      if (result.success) {
        // Refresh drift items
        await loadDriftItems();
        setRevertModal({ isOpen: false, driftId: null, isSubmitting: false });
      } else {
        setError(result.error?.message || 'Failed to revert draft');
        setRevertModal(prev => ({ ...prev, isSubmitting: false }));
      }
    } catch (err) {
      console.error('Revert draft error:', err);
      setError('An unexpected error occurred');
      setRevertModal(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const handleRevertCancel = () => {
    setRevertModal({ isOpen: false, driftId: null, isSubmitting: false });
  };

  // Handle approve drift (Risk/Credit role)
  const handleApproveDrift = (driftId: string) => {
    setApproveModal({
      isOpen: true,
      driftId,
      isSubmitting: false,
    });
  };

  const handleApproveSubmit = async (reason: string, category: ReasonCategory) => {
    if (!approveModal.driftId || !user) return;

    setApproveModal(prev => ({ ...prev, isSubmitting: true }));

    try {
      const result = await driftService.approveDrift(
        approveModal.driftId,
        reason,
        user.id,
        user.name
      );

      if (result.success) {
        // Refresh drift items
        await loadDriftItems();
        setApproveModal({ isOpen: false, driftId: null, isSubmitting: false });
      } else {
        setError(result.error?.message || 'Failed to approve drift');
        setApproveModal(prev => ({ ...prev, isSubmitting: false }));
      }
    } catch (err) {
      console.error('Approve drift error:', err);
      setError('An unexpected error occurred');
      setApproveModal(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const handleApproveCancel = () => {
    setApproveModal({ isOpen: false, driftId: null, isSubmitting: false });
  };

  // Handle locate in draft navigation
  const handleLocateInDraft = (driftId: string) => {
    const drift = driftItems.find(d => d.id === driftId);
    if (drift) {
      navigate(`/app/workspaces/${activeWorkspaceId}/drafting?clauseId=${drift.clauseId}&focus=drift`);
    }
  };

  // Reason categories for modals
  const reasonCategories: ReasonCategory[] = [
    'borrower_request',
    'market_conditions',
    'credit_update',
    'legal_requirement',
    'other',
  ];

  // Count unresolved high severity items
  const highDriftCount = filteredItems.filter(item => item.severity === 'HIGH' && item.status === 'unresolved').length;

  if (!activeWorkspaceId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center max-w-md mx-auto px-8">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <ExclamationTriangleIcon className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            No Workspace Selected
          </h3>
          <p className="text-slate-500 dark:text-slate-400">
            Please select a workspace to view commercial drift.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Commercial Drift
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Monitor deviations between approved baselines and current draft values
            </p>
          </div>
          
          {/* High Drift Warning */}
          {highDriftCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl shadow-sm">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-bold text-red-700 dark:text-red-300">
                {highDriftCount} High Drift {highDriftCount === 1 ? 'Item' : 'Items'} — Publishing Blocked
              </span>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <span className="text-sm font-medium text-red-800 dark:text-red-200">
                {error}
              </span>
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <DriftFilterBar
          filters={filters}
          onFiltersChange={setFilters}
        />

        {/* Content */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <LoadingSkeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12">
            <div className="text-center max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                {Object.keys(filters).length > 0 ? 'No Matching Items' : 'All Values Aligned'}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                {Object.keys(filters).length > 0
                  ? "No drift items match your current filters. Try adjusting your search criteria."
                  : "All values are currently aligned with approved baselines."}
              </p>
              {Object.keys(filters).length > 0 && (
                <Button
                  variant="secondary"
                  onClick={() => setFilters({})}
                  className="h-10 px-6 rounded-xl font-bold text-xs"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((drift) => (
              <DriftCard
                key={drift.id}
                drift={drift}
                onOverrideBaseline={canOverrideBaseline ? handleOverrideBaseline : undefined}
                onRevertDraft={canRevertDraft ? handleRevertDraft : undefined}
                onApproveDrift={canApproveDrift ? handleApproveDrift : undefined}
                onLocateInDraft={handleLocateInDraft}
                canOverrideBaseline={canOverrideBaseline}
                canRevertDraft={canRevertDraft}
                canApproveDrift={canApproveDrift}
              />
            ))}
          </div>
        )}

        {/* Override Baseline Modal */}
        <ReasonModal
          isOpen={overrideModal.isOpen}
          title="Override Baseline"
          reasonCategories={reasonCategories}
          onSubmit={handleOverrideSubmit}
          onCancel={handleOverrideCancel}
          submitText="Override Baseline"
          reasonLabel="Reason for overriding baseline"
          reasonPlaceholder="Please explain why this baseline override is necessary..."
          isSubmitting={overrideModal.isSubmitting}
        />

        {/* Revert Draft Modal */}
        <ReasonModal
          isOpen={revertModal.isOpen}
          title="Revert Draft"
          reasonCategories={reasonCategories}
          onSubmit={handleRevertSubmit}
          onCancel={handleRevertCancel}
          submitText="Revert Draft"
          reasonLabel="Reason for reverting draft"
          reasonPlaceholder="Please explain why this draft revert is necessary..."
          isSubmitting={revertModal.isSubmitting}
        />

        {/* Approve Drift Modal */}
        <ReasonModal
          isOpen={approveModal.isOpen}
          title="Approve Drift"
          reasonCategories={reasonCategories}
          onSubmit={handleApproveSubmit}
          onCancel={handleApproveCancel}
          submitText="Approve Drift"
          reasonLabel="Reason for approving drift"
          reasonPlaceholder="Please explain why this drift is acceptable and should be approved..."
          isSubmitting={approveModal.isSubmitting}
        />
      </div>
    </div>
  );
};

export default CommercialDriftPage;