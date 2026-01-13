import { z } from 'zod';

// Enums matching Prisma schema exactly
export const ClauseTypeEnum = z.enum(['financial', 'covenant', 'definition', 'xref', 'general']);
export const NodeTypeEnum = z.enum(['financial', 'covenant', 'definition', 'xref']);
export const VariableTypeEnum = z.enum(['financial', 'definition', 'covenant', 'ratio']);

// Clause schema matching Prisma Clause model
export const aiClauseSchema = z.object({
  title: z.string(),
  body: z.string(),
  type: ClauseTypeEnum,
  order: z.number().int(),
  isSensitive: z.boolean().default(false),
});

// Variable schema matching Prisma Variable model
// clauseIndex is used to link to parent clause after DB insert
export const aiVariableSchema = z.object({
  label: z.string(),
  type: VariableTypeEnum,
  value: z.string(),
  unit: z.string().optional(),
  baselineValue: z.string().optional(), // Set to value initially for drift tracking
  clauseIndex: z.number().int(), // maps to clauses[index] for linking
});

// Covenant schema matching Prisma Covenant model
// clauseIndex is used to link to source clause after DB insert
export const aiCovenantSchema = z.object({
  name: z.string(),
  testFrequency: z.string(),
  threshold: z.string(),
  calculationBasis: z.string(),
  clauseIndex: z.number().int(), // maps to clauses[index] for linking
});

// GraphNode schema matching Prisma GraphNode model
// clauseIndex/variableIndex are used to link after DB insert
export const aiGraphNodeSchema = z.object({
  label: z.string(),
  type: NodeTypeEnum,
  clauseIndex: z.number().int(), // maps to clauses[index] for linking
  variableIndex: z.number().int().optional(), // maps to variables[index] for linking
  value: z.string().optional(),
  hasDrift: z.boolean().default(false),
  hasWarning: z.boolean().default(false),
});

// GraphEdge schema matching Prisma GraphEdge model
// sourceNodeIndex/targetNodeIndex map to graphNodes[index] for linking
export const aiGraphEdgeSchema = z.object({
  sourceNodeIndex: z.number().int(),
  targetNodeIndex: z.number().int(),
  weight: z.number().int().default(1),
});

// Complete AI parse result schema
export const aiParseResultSchema = z.object({
  clauses: z.array(aiClauseSchema),
  variables: z.array(aiVariableSchema),
  covenants: z.array(aiCovenantSchema),
  graphNodes: z.array(aiGraphNodeSchema),
  graphEdges: z.array(aiGraphEdgeSchema),
  integrityScore: z.number().min(0).max(1),
});

// TypeScript types derived from schemas
export type AIClause = z.infer<typeof aiClauseSchema>;
export type AIVariable = z.infer<typeof aiVariableSchema>;
export type AICovenant = z.infer<typeof aiCovenantSchema>;
export type AIGraphNode = z.infer<typeof aiGraphNodeSchema>;
export type AIGraphEdge = z.infer<typeof aiGraphEdgeSchema>;
export type AIParseResult = z.infer<typeof aiParseResultSchema>;

// ============================================
// RECONCILIATION AI SCHEMAS
// ============================================

// Confidence level enum matching Prisma
export const ConfidenceLevelEnum = z.enum(['HIGH', 'MEDIUM', 'LOW']);

// Single reconciliation suggestion from AI
export const aiReconciliationSuggestionSchema = z.object({
  // The exact text snippet from the incoming document showing the proposed change
  incomingSnippet: z.string(),
  // The ID of the target clause in the existing document (must match exactly)
  targetClauseId: z.string(),
  // The ID of the target variable if change affects a specific variable (optional)
  targetVariableId: z.string().optional(),
  // Confidence level: HIGH = explicit numeric change, MEDIUM = ambiguous, LOW = unclear
  confidence: ConfidenceLevelEnum,
  // The original approved baseline value
  baselineValue: z.string(),
  // The current draft value (may equal baseline if no prior edits)
  currentValue: z.string(),
  // The new proposed value from the markup document
  proposedValue: z.string(),
  // Brief explanation of what changed and why this suggestion was made
  changeDescription: z.string().optional(),
});

// Complete AI reconciliation result schema
export const aiReconciliationResultSchema = z.object({
  suggestions: z.array(aiReconciliationSuggestionSchema),
  // Summary of what the AI found in the markup document
  summary: z.string().optional(),
  // Overall confidence in the parsing quality (0-1)
  parsingConfidence: z.number().min(0).max(1).optional(),
});

// TypeScript types for reconciliation
export type AIReconciliationSuggestion = z.infer<typeof aiReconciliationSuggestionSchema>;
export type AIReconciliationResult = z.infer<typeof aiReconciliationResultSchema>;
