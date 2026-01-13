// Mock backend and domain logic services
export * from './types';

// Export services individually to avoid naming conflicts
export { login, logout, getCurrentSession } from './authService';
export { 
  listWorkspacesForUser, 
  createWorkspace, 
  inviteMember, 
  listMembers,
  getWorkspaceUsers,
  removeMember,
  getUserMembership,
  getWorkspace
} from './workspaceService';
export { logEvent, listEvents, exportAudit } from './auditService';
export { 
  getDocumentOutline, 
  getClause, 
  updateClauseText, 
  bindVariable, 
  syncToGraph 
} from './draftService';
export { getGraph, recomputeGraph, locateNode } from './graphService';
export { 
  listDrift, 
  overrideBaseline, 
  revertDraft, 
  recomputeDrift 
} from './driftService';
export { 
  uploadDirtyDraft, 
  listReconciliationItems, 
  applySuggestion, 
  rejectSuggestion 
} from './reconciliationService';
export { 
  getGoldenRecord, 
  exportSchema, 
  publish 
} from './goldenRecordService';

// Export types from workspace service
export type { 
  CreateWorkspaceInput, 
  CreateWorkspaceResult,
  InviteMemberInput,
  InviteMemberResult,
  ChangeRoleInput,
  ChangeRoleResult,
  RemoveMemberResult,
  ServiceError
} from './workspaceService';
