import { z } from 'zod';

// ============================================
// AUTH SCHEMAS
// ============================================

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  department: z.string().optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// ============================================
// USER SCHEMAS
// ============================================

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  department: z.string().optional(),
  avatarUrl: z.string().url().optional().nullable(),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MANAGER', 'ANALYST', 'VIEWER']),
});

export const updateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING', 'LOCKED']),
});

// ============================================
// WORKSPACE SCHEMAS
// ============================================

export const createWorkspaceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  dealId: z.string().optional(),
  // Optional TXT content for AI clause parsing
  clausesText: z.string().optional(),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  dealId: z.string().optional(),
  isActive: z.boolean().optional(),
  settings: z.record(z.unknown()).optional(),
});

export const addWorkspaceMemberSchema = z.object({
  userId: z.string().cuid('Invalid user ID'),
  role: z.enum(['ADMIN', 'MANAGER', 'ANALYST', 'VIEWER']).default('ANALYST'),
});

// ============================================
// DOCUMENT SCHEMAS
// ============================================

export const createDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  type: z.string().min(1, 'Type is required'),
  content: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const updateDocumentSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
  status: z.enum(['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'ARCHIVED']).optional(),
});

// ============================================
// DRIFT SCHEMAS
// ============================================

export const createDriftSchema = z.object({
  documentId: z.string().cuid('Invalid document ID'),
  field: z.string().min(1, 'Field is required'),
  expectedValue: z.string(),
  actualValue: z.string(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  category: z.string().optional(),
  description: z.string().optional(),
});

export const updateDriftSchema = z.object({
  status: z.enum(['OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'WAIVED']).optional(),
  resolution: z.string().optional(),
});

export const resolveDriftSchema = z.object({
  status: z.enum(['RESOLVED', 'WAIVED']),
  resolution: z.string().min(1, 'Resolution is required'),
});

// ============================================
// DRAFT SCHEMAS
// ============================================

export const createDraftSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  content: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const updateDraftSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  content: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const reviewDraftSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  reviewNotes: z.string().optional(),
});

// ============================================
// RECONCILIATION SCHEMAS
// ============================================

export const createReconciliationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().optional(),
  sourceA: z.string().min(1, 'Source A is required'),
  sourceB: z.string().min(1, 'Source B is required'),
  config: z.record(z.unknown()).optional(),
});

// ============================================
// GOLDEN RECORD SCHEMAS
// ============================================

export const createGoldenRecordSchema = z.object({
  documentId: z.string().cuid('Invalid document ID'),
  recordType: z.string().min(1, 'Record type is required'),
  data: z.record(z.unknown()),
  metadata: z.record(z.unknown()).optional(),
});

export const updateGoldenRecordSchema = z.object({
  data: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const publishGoldenRecordSchema = z.object({
  ids: z.array(z.string().cuid('Invalid record ID')).min(1, 'At least one ID is required'),
});

// ============================================
// QUERY SCHEMAS
// ============================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const idParamSchema = z.object({
  id: z.string().cuid('Invalid ID'),
});

export const workspaceIdParamSchema = z.object({
  workspaceId: z.string().cuid('Invalid workspace ID'),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type AddWorkspaceMemberInput = z.infer<typeof addWorkspaceMemberSchema>;
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type CreateDriftInput = z.infer<typeof createDriftSchema>;
export type UpdateDriftInput = z.infer<typeof updateDriftSchema>;
export type ResolveDriftInput = z.infer<typeof resolveDriftSchema>;
export type CreateDraftInput = z.infer<typeof createDraftSchema>;
export type UpdateDraftInput = z.infer<typeof updateDraftSchema>;
export type ReviewDraftInput = z.infer<typeof reviewDraftSchema>;
export type CreateReconciliationInput = z.infer<typeof createReconciliationSchema>;
export type CreateGoldenRecordInput = z.infer<typeof createGoldenRecordSchema>;
export type UpdateGoldenRecordInput = z.infer<typeof updateGoldenRecordSchema>;
export type PublishGoldenRecordInput = z.infer<typeof publishGoldenRecordSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
