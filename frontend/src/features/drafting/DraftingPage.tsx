/**
 * Drafting Page - Nexus-Sync clause editing interface
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useWorkspace } from '../../stores/WorkspaceProvider';
import { usePermission } from '../../stores/PermissionProvider';
import { useAuth } from '../../stores/AuthProvider';
import { useToastHelpers } from '../../components/feedback/ToastContainer';
import { 
  SplitPaneLayout, 
  ClauseOutline, 
  ClauseEditor, 
  InspectorPanel 
} from '../../components/layout';
import { ReasonModal, VariableModal, VariableFormData } from '../../components/feedback';
import { DraftingSkeleton } from '../../components/ui';
import { 
  getDocumentOutline, 
  getClause, 
  getVariablesForClause, 
  updateClauseText,
  bindVariable,
  updateVariable,
  syncToGraph,
  OutlineItem 
} from '../../services/draftService';
import { Clause, Variable } from '../../types/document';
import { ReasonCategory } from '../../types/audit';

const DraftingPage: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();
  const { can } = usePermission();
  const { session } = useAuth();
  const { success: showSuccess, error: showError } = useToastHelpers();

  // State
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [selectedClause, setSelectedClause] = useState<Clause | null>(null);
  const [clauseVariables, setClauseVariables] = useState<Variable[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  // ReasonModal state
  const [reasonModal, setReasonModal] = useState<{
    isOpen: boolean;
    clauseId: string;
    newBody: string;
  }>({
    isOpen: false,
    clauseId: '',
    newBody: '',
  });

  // VariableModal state
  const [variableModal, setVariableModal] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    variable?: Variable;
  }>({
    isOpen: false,
    mode: 'create',
    variable: undefined,
  });

  // Get selected clause ID and focus node ID from URL params
  const selectedClauseId = searchParams.get('clauseId') || undefined;
  const focusNodeId = searchParams.get('focus') || undefined;

  // Check permissions
  const canEdit = can('draft:editText');
  const canEditVariables = can('variable:bind');

  // Reason categories for sensitive clause edits
  const reasonCategories: ReasonCategory[] = [
    'borrower_request',
    'market_conditions', 
    'credit_update',
    'legal_requirement',
    'other'
  ];

  // Load outline on mount
  useEffect(() => {
    if (!workspaceId) return;

    const loadOutline = async () => {
      try {
        setLoading(true);
        const outlineData = await getDocumentOutline(workspaceId);
        setOutline(outlineData);
      } catch (error) {
        console.error('Failed to load outline:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOutline();
  }, [workspaceId]);

  // Load selected clause when selection changes
  useEffect(() => {
    if (!selectedClauseId) {
      setSelectedClause(null);
      setClauseVariables([]);
      return;
    }

    const loadClause = async () => {
      try {
        const [clause, variables] = await Promise.all([
          getClause(selectedClauseId),
          getVariablesForClause(selectedClauseId)
        ]);
        
        setSelectedClause(clause);
        setClauseVariables(variables || []);

        // Show focus notification if navigated from graph
        if (focusNodeId && clause) {
          showSuccess(`Navigated to clause "${clause.title}" from Impact Map`);
        }
      } catch (error) {
        console.error('Failed to load clause:', error);
      }
    };

    loadClause();
  }, [selectedClauseId, focusNodeId]);

  // Handle clause selection
  const handleClauseSelect = (clauseId: string) => {
    // Clear focus parameter when manually selecting a clause
    setSearchParams({ clauseId });
  };

  // Handle clause save
  const handleClauseSave = async (clauseId: string, newBody: string) => {
    if (!activeWorkspace || !canEdit || !session) return;

    // Check if clause is sensitive and requires reason
    const clause = selectedClause;
    if (clause?.isSensitive) {
      // Open reason modal for sensitive clauses
      setReasonModal({
        isOpen: true,
        clauseId,
        newBody,
      });
      return;
    }

    // Save non-sensitive clause directly
    await performClauseSave(clauseId, newBody);
  };

  // Perform the actual clause save
  const performClauseSave = async (
    clauseId: string, 
    newBody: string, 
    reason?: string, 
    reasonCategory?: ReasonCategory
  ) => {
    if (!session) return;

    try {
      setSaving(true);
      const result = await updateClauseText(
        { 
          clauseId, 
          newBody,
          reason,
          reasonCategory 
        },
        session.userId,
        'Current User' // TODO: Get actual user name from auth context
      );
      
      if (result.success) {
        // Reload the clause to get updated data
        const updatedClause = await getClause(clauseId);
        setSelectedClause(updatedClause);
        
        // Show success toast
        showSuccess('Clause saved successfully');
      } else {
        throw new Error(result.error?.message || 'Failed to save clause');
      }
    } catch (error) {
      console.error('Failed to save clause:', error);
      showError(
        'Failed to save clause',
        error instanceof Error ? error.message : undefined
      );
      throw error;
    } finally {
      setSaving(false);
    }
  };

  // Handle reason modal submission
  const handleReasonSubmit = async (reason: string, category: ReasonCategory) => {
    await performClauseSave(
      reasonModal.clauseId,
      reasonModal.newBody,
      reason,
      category
    );
    setReasonModal({ isOpen: false, clauseId: '', newBody: '' });
  };

  // Handle reason modal cancel
  const handleReasonCancel = () => {
    setReasonModal({ isOpen: false, clauseId: '', newBody: '' });
  };

  // Handle variable actions (placeholder)
  const handleVariableEdit = (variable: Variable) => {
    setVariableModal({
      isOpen: true,
      mode: 'edit',
      variable,
    });
  };

  const handleVariableAdd = () => {
    setVariableModal({
      isOpen: true,
      mode: 'create',
      variable: undefined,
    });
  };

  // Handle variable modal submission
  const handleVariableSubmit = async (data: VariableFormData) => {
    if (!session || !activeWorkspace || !selectedClauseId) return;

    try {
      setSaving(true);
      
      if (variableModal.mode === 'create') {
        // Create new variable
        const result = await bindVariable(
          {
            workspaceId: activeWorkspace.id,
            clauseId: selectedClauseId,
            label: data.label,
            type: data.type,
            value: data.value,
            unit: data.unit,
          },
          session.userId,
          'Current User' // TODO: Get actual user name
        );

        if (result.success) {
          // Reload variables
          const updatedVariables = await getVariablesForClause(selectedClauseId);
          setClauseVariables(updatedVariables);
          
          showSuccess('Variable bound successfully');
        } else {
          throw new Error(result.error?.message || 'Failed to bind variable');
        }
      } else if (variableModal.variable) {
        // Update existing variable
        const result = await updateVariable(
          variableModal.variable.id,
          {
            label: data.label,
            type: data.type,
            value: data.value,
            unit: data.unit,
          },
          session.userId,
          'Current User' // TODO: Get actual user name
        );

        if (result.success) {
          // Reload variables
          const updatedVariables = await getVariablesForClause(selectedClauseId);
          setClauseVariables(updatedVariables);
          
          showSuccess('Variable updated successfully');
        } else {
          throw new Error(result.error?.message || 'Failed to update variable');
        }
      }

      // Close modal
      setVariableModal({ isOpen: false, mode: 'create', variable: undefined });
    } catch (error) {
      console.error('Variable operation failed:', error);
      showError(
        'Variable operation failed',
        error instanceof Error ? error.message : undefined
      );
    } finally {
      setSaving(false);
    }
  };

  // Handle variable suggestion from financial pattern detection
  const handleVariableSuggestion = (suggestion: {
    label: string;
    type: 'financial' | 'covenant' | 'ratio';
    value: string;
    unit?: string;
  }) => {
    // Pre-populate the variable modal with the suggestion
    setVariableModal({
      isOpen: true,
      mode: 'create',
      variable: undefined,
    });
    
    // We could enhance this to pre-fill the modal, but for now just open it
    showSuccess(
      'Financial pattern detected',
      `${suggestion.value}${suggestion.unit || ''}. Variable modal opened.`
    );
  };

  // Handle view in impact map navigation
  const handleViewInGraph = (clauseId: string) => {
    if (!workspaceId) return;
    
    // Navigate to impact map with clause focus
    navigate(`/app/workspaces/${workspaceId}/impact-map?clauseId=${clauseId}&focus=clause`);
  };

  // Handle sync to graph
  const handleSyncToGraph = async () => {
    if (!session || !activeWorkspace) return;

    try {
      setSyncing(true);
      const result = await syncToGraph(
        activeWorkspace.id,
        session.userId,
        'Current User' // TODO: Get actual user name
      );

      if (result.success) {
        showSuccess(
          'Graph synchronized successfully',
          `Integrity: ${result.integrityScore}%, Nodes: ${result.nodeCount}, Edges: ${result.edgeCount}`
        );
      } else {
        throw new Error(result.error?.message || 'Failed to sync to graph');
      }
    } catch (error) {
      console.error('Sync to graph failed:', error);
      showError(
        'Failed to sync to graph',
        error instanceof Error ? error.message : undefined
      );
    } finally {
      setSyncing(false);
    }
  };

  // Handle variable modal cancel
  const handleVariableCancel = () => {
    setVariableModal({ isOpen: false, mode: 'create', variable: undefined });
  };

  if (loading) {
    return <DraftingSkeleton />;
  }

  return (
    <div className="h-full">
      <SplitPaneLayout
        outline={
          <ClauseOutline
            clauses={outline}
            activeClauseId={selectedClauseId}
            onClauseSelect={handleClauseSelect}
            loading={loading}
          />
        }
        editor={
          <ClauseEditor
            clause={selectedClause}
            canEdit={canEdit}
            onSave={handleClauseSave}
            onSuggestVariable={handleVariableSuggestion}
            onSyncToGraph={handleSyncToGraph}
            onViewInGraph={handleViewInGraph}
            saving={saving}
            syncing={syncing}
          />
        }
        inspector={
          <InspectorPanel
            clauseId={selectedClauseId}
            variables={clauseVariables}
            onVariableEdit={handleVariableEdit}
            onVariableAdd={handleVariableAdd}
            canEditVariables={canEditVariables}
          />
        }
      />

      {/* Reason Modal for sensitive clause edits */}
      <ReasonModal
        isOpen={reasonModal.isOpen}
        title="Reason for Sensitive Clause Edit"
        reasonCategories={reasonCategories}
        onSubmit={handleReasonSubmit}
        onCancel={handleReasonCancel}
        submitText="Save Changes"
        reasonLabel="Reason for Edit"
        reasonPlaceholder="Please provide a detailed reason for editing this sensitive clause..."
        isSubmitting={saving}
      />

      {/* Variable Modal for binding and editing variables */}
      <VariableModal
        isOpen={variableModal.isOpen}
        title={variableModal.mode === 'create' ? 'Bind New Variable' : 'Edit Variable'}
        variable={variableModal.variable}
        onSubmit={handleVariableSubmit}
        onCancel={handleVariableCancel}
        isSubmitting={saving}
      />
    </div>
  );
};

export default DraftingPage;