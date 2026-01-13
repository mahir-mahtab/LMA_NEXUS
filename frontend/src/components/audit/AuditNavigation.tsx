/**
 * Audit Navigation Utilities
 * Handles navigation from audit events to related pages
 * Requirements: 11.3
 */

import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../../stores/WorkspaceProvider';
import { AuditEvent } from '../../types/audit';

export interface AuditNavigationProps {
  onViewInDraft?: (event: AuditEvent) => void;
  onViewInGraph?: (event: AuditEvent) => void;
}

export const useAuditNavigation = () => {
  const navigate = useNavigate();
  const { activeWorkspaceId } = useWorkspace();

  /**
   * Navigate to drafting page with clause selected
   * Requirements: 11.3
   */
  const navigateToClause = (event: AuditEvent) => {
    if (!activeWorkspaceId) return;

    // Extract clause ID from the event
    let clauseId: string | undefined;

    if (event.targetType === 'clause' && event.targetId) {
      clauseId = event.targetId;
    } else if (event.eventType === 'VARIABLE_EDIT' || event.eventType === 'VARIABLE_BIND') {
      // For variable events, we need to extract the clause ID from the event data
      try {
        if (event.afterState) {
          const data = JSON.parse(event.afterState);
          clauseId = data.clauseId;
        }
      } catch {
        // If we can't parse the state, use the target ID if it's a clause
        if (event.targetType === 'clause') {
          clauseId = event.targetId;
        }
      }
    }

    if (clauseId) {
      // Navigate to drafting page with the clause selected
      navigate(`/app/workspaces/${activeWorkspaceId}/drafting?clauseId=${clauseId}&from=audit`);
    }
  };

  /**
   * Navigate to impact map with node selected
   * Requirements: 11.3
   */
  const navigateToGraph = (event: AuditEvent) => {
    if (!activeWorkspaceId) return;

    // Extract node ID from the event
    let nodeId: string | undefined;

    if (event.targetType === 'node' && event.targetId) {
      nodeId = event.targetId;
    } else if (event.eventType === 'GRAPH_SYNC') {
      // For graph sync events, we might want to navigate to the general graph view
      navigate(`/app/workspaces/${activeWorkspaceId}/impact-map?from=audit`);
      return;
    } else if (event.eventType === 'VARIABLE_EDIT' || event.eventType === 'VARIABLE_BIND') {
      // For variable events, try to find the associated node
      try {
        if (event.afterState) {
          const data = JSON.parse(event.afterState);
          nodeId = data.nodeId || data.variableId;
        }
      } catch {
        // If we can't parse the state, use the target ID if it's a node
        if (event.targetType === 'node' || event.targetType === 'variable') {
          nodeId = event.targetId;
        }
      }
    }

    if (nodeId) {
      // Navigate to impact map with the node selected
      navigate(`/app/workspaces/${activeWorkspaceId}/impact-map?nodeId=${nodeId}&from=audit`);
    } else {
      // Navigate to general impact map
      navigate(`/app/workspaces/${activeWorkspaceId}/impact-map?from=audit`);
    }
  };

  /**
   * Check if an event can navigate to drafting page
   */
  const canNavigateToClause = (event: AuditEvent): boolean => {
    const clauseRelatedEvents = ['CLAUSE_EDIT', 'VARIABLE_EDIT', 'VARIABLE_BIND'];
    return clauseRelatedEvents.includes(event.eventType) && 
           (event.targetType === 'clause' || 
            (event.targetType === 'variable' && Boolean(event.afterState)));
  };

  /**
   * Check if an event can navigate to impact map
   */
  const canNavigateToGraph = (event: AuditEvent): boolean => {
    const graphRelatedEvents = ['GRAPH_SYNC', 'VARIABLE_EDIT', 'VARIABLE_BIND'];
    return graphRelatedEvents.includes(event.eventType) && 
           (event.targetType === 'node' || 
            event.targetType === 'variable' || 
            event.eventType === 'GRAPH_SYNC');
  };

  return {
    navigateToClause,
    navigateToGraph,
    canNavigateToClause,
    canNavigateToGraph,
  };
};

/**
 * Higher-order component that provides audit navigation functionality
 */
export const withAuditNavigation = <P extends object>(
  Component: React.ComponentType<P & AuditNavigationProps>
) => {
  return (props: P) => {
    const { navigateToClause, navigateToGraph } = useAuditNavigation();

    return (
      <Component
        {...props}
        onViewInDraft={navigateToClause}
        onViewInGraph={navigateToGraph}
      />
    );
  };
};