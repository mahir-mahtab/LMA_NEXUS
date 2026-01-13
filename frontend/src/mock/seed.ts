/**
 * Seed data for LMA Nexus mock database
 * Requirements: 14.3
 * 
 * Contains realistic mock data:
 * - 3 workspaces
 * - 12 clauses
 * - 15 variables
 * - 45 graph edges
 * - 5 drift items
 * - 3 reconciliation items
 * - 30 audit events
 */

import { DatabaseState, setSeedData } from './mockDb';
import {
  User,
  Workspace,
  WorkspaceMember,
  Clause,
  Variable,
  GraphNode,
  GraphEdge,
  DriftItem,
  ReconciliationItem,
  ReconciliationSession,
  GoldenRecord,
  AuditEvent,
  Covenant,
  DownstreamConnector,
} from '../types';

// ============================================================================
// USERS (5 users representing different roles)
// ============================================================================
const users: User[] = [
  {
    id: 'user-001',
    email: 'sarah.chen@bankco.com',
    name: 'Sarah Chen',
    avatarUrl: undefined,
    createdAt: '2024-01-15T09:00:00Z',
  },
  {
    id: 'user-002',
    email: 'james.wilson@legalfirm.com',
    name: 'James Wilson',
    avatarUrl: undefined,
    createdAt: '2024-01-16T10:30:00Z',
  },
  {
    id: 'user-003',
    email: 'maria.garcia@bankco.com',
    name: 'Maria Garcia',
    avatarUrl: undefined,
    createdAt: '2024-01-17T14:00:00Z',
  },
  {
    id: 'user-004',
    email: 'david.kim@investco.com',
    name: 'David Kim',
    avatarUrl: undefined,
    createdAt: '2024-02-01T08:00:00Z',
  },
  {
    id: 'user-005',
    email: 'emma.brown@bankco.com',
    name: 'Emma Brown',
    avatarUrl: undefined,
    createdAt: '2024-02-10T11:00:00Z',
  },
];

// ============================================================================
// WORKSPACES (3 workspaces representing different deals)
// ============================================================================
const workspaces: Workspace[] = [
  {
    id: 'ws-001',
    name: 'Project Atlas - Senior Secured Facility',
    currency: 'USD',
    amount: 500000000,
    standard: 'LMA-style v2024.1',
    basePdfName: 'Atlas_Facility_Agreement_v1.pdf',
    createdAt: '2024-06-01T09:00:00Z',
    lastSyncAt: '2024-12-20T15:30:00Z',
    createdBy: 'user-001',
    governanceRules: {
      requireReasonForSensitiveEdits: true,
      legalCanRevertDraft: true,
      riskApprovalRequiredForOverride: true,
      publishBlockedWhenHighDrift: true,
      definitionsLockedAfterApproval: false,
      externalCounselReadOnly: false,
    },
  },
  {
    id: 'ws-002',
    name: 'Project Beacon - Revolving Credit',
    currency: 'EUR',
    amount: 250000000,
    standard: 'LMA-style v2024.1',
    basePdfName: 'Beacon_RCF_Draft.pdf',
    createdAt: '2024-08-15T10:00:00Z',
    lastSyncAt: '2024-12-19T11:00:00Z',
    createdBy: 'user-001',
    governanceRules: {
      requireReasonForSensitiveEdits: true,
      legalCanRevertDraft: false,
      riskApprovalRequiredForOverride: false,
      publishBlockedWhenHighDrift: true,
      definitionsLockedAfterApproval: true,
      externalCounselReadOnly: true,
    },
  },
  {
    id: 'ws-003',
    name: 'Project Coral - Term Loan B',
    currency: 'GBP',
    amount: 175000000,
    standard: 'LMA-style v2025.0',
    basePdfName: 'Coral_TLB_Agreement.pdf',
    createdAt: '2024-10-01T08:30:00Z',
    lastSyncAt: '2024-12-18T09:45:00Z',
    createdBy: 'user-005',
    governanceRules: {
      requireReasonForSensitiveEdits: true,
      legalCanRevertDraft: true,
      riskApprovalRequiredForOverride: true,
      publishBlockedWhenHighDrift: true,
      definitionsLockedAfterApproval: false,
      externalCounselReadOnly: false,
    },
  },
];

// ============================================================================
// WORKSPACE MEMBERS
// ============================================================================
const workspaceMembers: WorkspaceMember[] = [
  // Workspace 1 - Atlas
  { id: 'wm-001', workspaceId: 'ws-001', userId: 'user-001', role: 'agent', isAdmin: true, status: 'active', invitedAt: '2024-06-01T09:00:00Z', joinedAt: '2024-06-01T09:00:00Z' },
  { id: 'wm-002', workspaceId: 'ws-001', userId: 'user-002', role: 'legal', isAdmin: false, status: 'active', invitedAt: '2024-06-02T10:00:00Z', joinedAt: '2024-06-02T11:00:00Z' },
  { id: 'wm-003', workspaceId: 'ws-001', userId: 'user-003', role: 'risk', isAdmin: false, status: 'active', invitedAt: '2024-06-03T09:00:00Z', joinedAt: '2024-06-03T10:00:00Z' },
  { id: 'wm-004', workspaceId: 'ws-001', userId: 'user-004', role: 'investor', isAdmin: false, status: 'active', invitedAt: '2024-06-15T14:00:00Z', joinedAt: '2024-06-16T09:00:00Z' },
  // Workspace 2 - Beacon
  { id: 'wm-005', workspaceId: 'ws-002', userId: 'user-001', role: 'agent', isAdmin: true, status: 'active', invitedAt: '2024-08-15T10:00:00Z', joinedAt: '2024-08-15T10:00:00Z' },
  { id: 'wm-006', workspaceId: 'ws-002', userId: 'user-002', role: 'legal', isAdmin: false, status: 'active', invitedAt: '2024-08-16T09:00:00Z', joinedAt: '2024-08-16T10:00:00Z' },
  { id: 'wm-007', workspaceId: 'ws-002', userId: 'user-003', role: 'risk', isAdmin: false, status: 'active', invitedAt: '2024-08-17T11:00:00Z', joinedAt: '2024-08-17T14:00:00Z' },
  // Workspace 3 - Coral
  { id: 'wm-008', workspaceId: 'ws-003', userId: 'user-005', role: 'agent', isAdmin: true, status: 'active', invitedAt: '2024-10-01T08:30:00Z', joinedAt: '2024-10-01T08:30:00Z' },
  { id: 'wm-009', workspaceId: 'ws-003', userId: 'user-002', role: 'legal', isAdmin: false, status: 'active', invitedAt: '2024-10-02T09:00:00Z', joinedAt: '2024-10-02T10:00:00Z' },
  { id: 'wm-010', workspaceId: 'ws-003', userId: 'user-001', role: 'agent', isAdmin: false, status: 'active', invitedAt: '2024-10-05T11:00:00Z', joinedAt: '2024-10-05T14:00:00Z' },
];


// ============================================================================
// CLAUSES (12 clauses for workspace 1 - Atlas)
// ============================================================================
const clauses: Clause[] = [
  {
    id: 'clause-001',
    workspaceId: 'ws-001',
    title: '1. Definitions',
    body: 'In this Agreement, unless the context otherwise requires:\n\n"Applicable Margin" means the percentage rate per annum determined in accordance with Schedule 4.\n\n"Business Day" means a day (other than a Saturday or Sunday) on which banks are open for general business in London and New York.\n\n"Commitment" means the commitment of each Lender to make available its participation in the Facility.',
    type: 'definition',
    order: 1,
    isSensitive: true,
    isLocked: false,
    lastModifiedAt: '2024-12-15T10:30:00Z',
    lastModifiedBy: 'user-002',
  },
  {
    id: 'clause-002',
    workspaceId: 'ws-001',
    title: '2. The Facility',
    body: 'Subject to the terms of this Agreement, the Lenders agree to make available to the Borrower a senior secured term loan facility in an aggregate amount equal to USD 500,000,000 (the "Facility").',
    type: 'financial',
    order: 2,
    isSensitive: true,
    isLocked: false,
    lastModifiedAt: '2024-12-10T14:00:00Z',
    lastModifiedBy: 'user-001',
  },
  {
    id: 'clause-003',
    workspaceId: 'ws-001',
    title: '3. Interest',
    body: 'The rate of interest on each Loan for each Interest Period is the percentage rate per annum which is the aggregate of:\n\n(a) the Applicable Margin; and\n(b) SOFR.\n\nThe Applicable Margin shall be 275 basis points per annum.',
    type: 'financial',
    order: 3,
    isSensitive: true,
    isLocked: false,
    lastModifiedAt: '2024-12-18T09:15:00Z',
    lastModifiedBy: 'user-002',
  },
  {
    id: 'clause-004',
    workspaceId: 'ws-001',
    title: '4. Repayment',
    body: 'The Borrower shall repay the Loans in full on the Termination Date. The Termination Date shall be the date falling 5 years after the date of this Agreement.',
    type: 'financial',
    order: 4,
    isSensitive: true,
    isLocked: false,
    lastModifiedAt: '2024-12-05T11:00:00Z',
    lastModifiedBy: 'user-001',
  },
  {
    id: 'clause-005',
    workspaceId: 'ws-001',
    title: '5. Prepayment',
    body: 'The Borrower may prepay any Loan in whole or in part (but if in part, being an amount that reduces the amount of the Loan by a minimum amount of USD 5,000,000).',
    type: 'financial',
    order: 5,
    isSensitive: false,
    isLocked: false,
    lastModifiedAt: '2024-11-28T16:30:00Z',
    lastModifiedBy: 'user-002',
  },
  {
    id: 'clause-006',
    workspaceId: 'ws-001',
    title: '6. Financial Covenants',
    body: 'The Borrower shall ensure that:\n\n(a) Leverage Ratio: the ratio of Total Net Debt to EBITDA does not exceed 4.50:1.00 at any time;\n\n(b) Interest Cover: the ratio of EBITDA to Net Finance Charges is not less than 3.00:1.00 in respect of any Relevant Period.',
    type: 'covenant',
    order: 6,
    isSensitive: true,
    isLocked: false,
    lastModifiedAt: '2024-12-19T14:45:00Z',
    lastModifiedBy: 'user-001',
  },
  {
    id: 'clause-007',
    workspaceId: 'ws-001',
    title: '7. EBITDA Definition',
    body: '"EBITDA" means, in respect of any Relevant Period, the consolidated operating profit of the Group before taxation:\n\n(a) before deducting any interest, commission, fees, discounts, prepayment fees, premiums or charges;\n(b) not including any accrued interest owing to any member of the Group;\n(c) before taking into account any Exceptional Items.',
    type: 'definition',
    order: 7,
    isSensitive: true,
    isLocked: false,
    lastModifiedAt: '2024-12-12T10:00:00Z',
    lastModifiedBy: 'user-002',
  },
  {
    id: 'clause-008',
    workspaceId: 'ws-001',
    title: '8. Events of Default',
    body: 'Each of the events or circumstances set out in this Clause 8 is an Event of Default:\n\n(a) Non-payment: An Obligor does not pay on the due date any amount payable pursuant to a Finance Document.\n\n(b) Financial covenants: Any requirement of Clause 6 (Financial Covenants) is not satisfied.',
    type: 'general',
    order: 8,
    isSensitive: false,
    isLocked: false,
    lastModifiedAt: '2024-11-20T09:30:00Z',
    lastModifiedBy: 'user-002',
  },
  {
    id: 'clause-009',
    workspaceId: 'ws-001',
    title: '9. Representations',
    body: 'Each Obligor makes the representations and warranties set out in this Clause 9 to each Finance Party on the date of this Agreement.',
    type: 'general',
    order: 9,
    isSensitive: false,
    isLocked: false,
    lastModifiedAt: '2024-11-15T14:00:00Z',
    lastModifiedBy: 'user-002',
  },
  {
    id: 'clause-010',
    workspaceId: 'ws-001',
    title: '10. Security',
    body: 'The obligations of each Obligor under the Finance Documents are secured by the Transaction Security as described in Schedule 6 (Security Documents).',
    type: 'xref',
    order: 10,
    isSensitive: false,
    isLocked: false,
    lastModifiedAt: '2024-11-10T11:30:00Z',
    lastModifiedBy: 'user-001',
  },
  {
    id: 'clause-011',
    workspaceId: 'ws-001',
    title: '11. Fees',
    body: 'The Borrower shall pay to the Agent (for the account of each Lender) a commitment fee computed at the rate of 40% of the Applicable Margin on that Lender\'s Available Commitment.',
    type: 'financial',
    order: 11,
    isSensitive: true,
    isLocked: false,
    lastModifiedAt: '2024-12-08T15:00:00Z',
    lastModifiedBy: 'user-001',
  },
  {
    id: 'clause-012',
    workspaceId: 'ws-001',
    title: '12. Governing Law',
    body: 'This Agreement and any non-contractual obligations arising out of or in connection with it are governed by English law.',
    type: 'general',
    order: 12,
    isSensitive: false,
    isLocked: false,
    lastModifiedAt: '2024-10-25T10:00:00Z',
    lastModifiedBy: 'user-002',
  },
];


// ============================================================================
// VARIABLES (15 variables bound to clauses)
// ============================================================================
const variables: Variable[] = [
  {
    id: 'var-001',
    workspaceId: 'ws-001',
    clauseId: 'clause-002',
    label: 'Facility Amount',
    type: 'financial',
    value: '500000000',
    unit: 'USD',
    baselineValue: '500000000',
    createdAt: '2024-06-05T10:00:00Z',
    lastModifiedAt: '2024-12-10T14:00:00Z',
  },
  {
    id: 'var-002',
    workspaceId: 'ws-001',
    clauseId: 'clause-003',
    label: 'Applicable Margin',
    type: 'financial',
    value: '275',
    unit: 'bps',
    baselineValue: '250',
    createdAt: '2024-06-05T10:30:00Z',
    lastModifiedAt: '2024-12-18T09:15:00Z',
  },
  {
    id: 'var-003',
    workspaceId: 'ws-001',
    clauseId: 'clause-004',
    label: 'Tenor',
    type: 'financial',
    value: '5',
    unit: 'years',
    baselineValue: '5',
    createdAt: '2024-06-05T11:00:00Z',
    lastModifiedAt: '2024-12-05T11:00:00Z',
  },
  {
    id: 'var-004',
    workspaceId: 'ws-001',
    clauseId: 'clause-005',
    label: 'Minimum Prepayment',
    type: 'financial',
    value: '5000000',
    unit: 'USD',
    baselineValue: '5000000',
    createdAt: '2024-06-06T09:00:00Z',
    lastModifiedAt: '2024-11-28T16:30:00Z',
  },
  {
    id: 'var-005',
    workspaceId: 'ws-001',
    clauseId: 'clause-006',
    label: 'Leverage Ratio Cap',
    type: 'covenant',
    value: '4.50',
    unit: 'x',
    baselineValue: '4.00',
    createdAt: '2024-06-06T10:00:00Z',
    lastModifiedAt: '2024-12-19T14:45:00Z',
  },
  {
    id: 'var-006',
    workspaceId: 'ws-001',
    clauseId: 'clause-006',
    label: 'Interest Cover Floor',
    type: 'covenant',
    value: '3.00',
    unit: 'x',
    baselineValue: '3.50',
    createdAt: '2024-06-06T10:30:00Z',
    lastModifiedAt: '2024-12-19T14:45:00Z',
  },
  {
    id: 'var-007',
    workspaceId: 'ws-001',
    clauseId: 'clause-007',
    label: 'EBITDA Definition',
    type: 'definition',
    value: 'Consolidated operating profit before interest, tax, depreciation, amortization, and exceptional items',
    unit: undefined,
    baselineValue: 'Consolidated operating profit before interest, tax, depreciation, amortization, and exceptional items',
    createdAt: '2024-06-07T09:00:00Z',
    lastModifiedAt: '2024-12-12T10:00:00Z',
  },
  {
    id: 'var-008',
    workspaceId: 'ws-001',
    clauseId: 'clause-011',
    label: 'Commitment Fee Rate',
    type: 'financial',
    value: '40',
    unit: '%',
    baselineValue: '35',
    createdAt: '2024-06-07T10:00:00Z',
    lastModifiedAt: '2024-12-08T15:00:00Z',
  },
  {
    id: 'var-009',
    workspaceId: 'ws-001',
    clauseId: 'clause-001',
    label: 'Business Day Definition',
    type: 'definition',
    value: 'London and New York',
    unit: undefined,
    baselineValue: 'London and New York',
    createdAt: '2024-06-08T09:00:00Z',
    lastModifiedAt: '2024-12-15T10:30:00Z',
  },
  {
    id: 'var-010',
    workspaceId: 'ws-001',
    clauseId: 'clause-003',
    label: 'Reference Rate',
    type: 'financial',
    value: 'SOFR',
    unit: undefined,
    baselineValue: 'SOFR',
    createdAt: '2024-06-08T10:00:00Z',
    lastModifiedAt: '2024-12-18T09:15:00Z',
  },
  // Variables for workspace 2
  {
    id: 'var-011',
    workspaceId: 'ws-002',
    clauseId: 'clause-002',
    label: 'RCF Commitment',
    type: 'financial',
    value: '250000000',
    unit: 'EUR',
    baselineValue: '250000000',
    createdAt: '2024-08-20T10:00:00Z',
    lastModifiedAt: '2024-12-15T11:00:00Z',
  },
  {
    id: 'var-012',
    workspaceId: 'ws-002',
    clauseId: 'clause-003',
    label: 'RCF Margin',
    type: 'financial',
    value: '200',
    unit: 'bps',
    baselineValue: '200',
    createdAt: '2024-08-20T11:00:00Z',
    lastModifiedAt: '2024-12-10T09:00:00Z',
  },
  // Variables for workspace 3
  {
    id: 'var-013',
    workspaceId: 'ws-003',
    clauseId: 'clause-002',
    label: 'TLB Amount',
    type: 'financial',
    value: '175000000',
    unit: 'GBP',
    baselineValue: '175000000',
    createdAt: '2024-10-05T10:00:00Z',
    lastModifiedAt: '2024-12-12T14:00:00Z',
  },
  {
    id: 'var-014',
    workspaceId: 'ws-003',
    clauseId: 'clause-003',
    label: 'TLB Margin',
    type: 'financial',
    value: '350',
    unit: 'bps',
    baselineValue: '325',
    createdAt: '2024-10-05T11:00:00Z',
    lastModifiedAt: '2024-12-18T10:00:00Z',
  },
  {
    id: 'var-015',
    workspaceId: 'ws-003',
    clauseId: 'clause-006',
    label: 'TLB Leverage Cap',
    type: 'covenant',
    value: '5.00',
    unit: 'x',
    baselineValue: '5.00',
    createdAt: '2024-10-06T09:00:00Z',
    lastModifiedAt: '2024-12-15T16:00:00Z',
  },
];


// ============================================================================
// GRAPH NODES (derived from clauses and variables)
// ============================================================================
const graphNodes: GraphNode[] = [
  // Clause nodes
  { id: 'node-c001', workspaceId: 'ws-001', label: 'Definitions', type: 'definition', clauseId: 'clause-001', hasDrift: false, hasWarning: false },
  { id: 'node-c002', workspaceId: 'ws-001', label: 'The Facility', type: 'financial', clauseId: 'clause-002', hasDrift: false, hasWarning: false },
  { id: 'node-c003', workspaceId: 'ws-001', label: 'Interest', type: 'financial', clauseId: 'clause-003', hasDrift: true, hasWarning: true },
  { id: 'node-c004', workspaceId: 'ws-001', label: 'Repayment', type: 'financial', clauseId: 'clause-004', hasDrift: false, hasWarning: false },
  { id: 'node-c005', workspaceId: 'ws-001', label: 'Prepayment', type: 'financial', clauseId: 'clause-005', hasDrift: false, hasWarning: false },
  { id: 'node-c006', workspaceId: 'ws-001', label: 'Financial Covenants', type: 'covenant', clauseId: 'clause-006', hasDrift: true, hasWarning: true },
  { id: 'node-c007', workspaceId: 'ws-001', label: 'EBITDA Definition', type: 'definition', clauseId: 'clause-007', hasDrift: false, hasWarning: false },
  { id: 'node-c008', workspaceId: 'ws-001', label: 'Events of Default', type: 'xref', clauseId: 'clause-008', hasDrift: false, hasWarning: false },
  { id: 'node-c010', workspaceId: 'ws-001', label: 'Security', type: 'xref', clauseId: 'clause-010', hasDrift: false, hasWarning: false },
  { id: 'node-c011', workspaceId: 'ws-001', label: 'Fees', type: 'financial', clauseId: 'clause-011', hasDrift: true, hasWarning: false },
  // Variable nodes
  { id: 'node-v001', workspaceId: 'ws-001', label: 'Facility Amount', type: 'financial', variableId: 'var-001', value: '500,000,000 USD', hasDrift: false, hasWarning: false },
  { id: 'node-v002', workspaceId: 'ws-001', label: 'Applicable Margin', type: 'financial', variableId: 'var-002', value: '275 bps', hasDrift: true, hasWarning: true },
  { id: 'node-v003', workspaceId: 'ws-001', label: 'Tenor', type: 'financial', variableId: 'var-003', value: '5 years', hasDrift: false, hasWarning: false },
  { id: 'node-v004', workspaceId: 'ws-001', label: 'Min Prepayment', type: 'financial', variableId: 'var-004', value: '5,000,000 USD', hasDrift: false, hasWarning: false },
  { id: 'node-v005', workspaceId: 'ws-001', label: 'Leverage Ratio Cap', type: 'covenant', variableId: 'var-005', value: '4.50x', hasDrift: true, hasWarning: true },
  { id: 'node-v006', workspaceId: 'ws-001', label: 'Interest Cover Floor', type: 'covenant', variableId: 'var-006', value: '3.00x', hasDrift: true, hasWarning: false },
  { id: 'node-v007', workspaceId: 'ws-001', label: 'EBITDA', type: 'definition', variableId: 'var-007', hasDrift: false, hasWarning: false },
  { id: 'node-v008', workspaceId: 'ws-001', label: 'Commitment Fee', type: 'financial', variableId: 'var-008', value: '40%', hasDrift: true, hasWarning: false },
  { id: 'node-v010', workspaceId: 'ws-001', label: 'Reference Rate', type: 'financial', variableId: 'var-010', value: 'SOFR', hasDrift: false, hasWarning: false },
];

// ============================================================================
// GRAPH EDGES (45 edges showing dependencies)
// ============================================================================
const graphEdges: GraphEdge[] = [
  // Definitions -> other clauses
  { id: 'edge-001', workspaceId: 'ws-001', sourceId: 'node-c001', targetId: 'node-c002', weight: 3 },
  { id: 'edge-002', workspaceId: 'ws-001', sourceId: 'node-c001', targetId: 'node-c003', weight: 5 },
  { id: 'edge-003', workspaceId: 'ws-001', sourceId: 'node-c001', targetId: 'node-c004', weight: 2 },
  { id: 'edge-004', workspaceId: 'ws-001', sourceId: 'node-c001', targetId: 'node-c005', weight: 2 },
  { id: 'edge-005', workspaceId: 'ws-001', sourceId: 'node-c001', targetId: 'node-c006', weight: 4 },
  { id: 'edge-006', workspaceId: 'ws-001', sourceId: 'node-c001', targetId: 'node-c008', weight: 3 },
  // Facility -> Interest, Repayment
  { id: 'edge-007', workspaceId: 'ws-001', sourceId: 'node-c002', targetId: 'node-c003', weight: 5 },
  { id: 'edge-008', workspaceId: 'ws-001', sourceId: 'node-c002', targetId: 'node-c004', weight: 5 },
  { id: 'edge-009', workspaceId: 'ws-001', sourceId: 'node-c002', targetId: 'node-c005', weight: 4 },
  { id: 'edge-010', workspaceId: 'ws-001', sourceId: 'node-c002', targetId: 'node-c011', weight: 3 },
  // Interest -> Covenants
  { id: 'edge-011', workspaceId: 'ws-001', sourceId: 'node-c003', targetId: 'node-c006', weight: 4 },
  // EBITDA Definition -> Covenants
  { id: 'edge-012', workspaceId: 'ws-001', sourceId: 'node-c007', targetId: 'node-c006', weight: 5 },
  // Covenants -> Events of Default
  { id: 'edge-013', workspaceId: 'ws-001', sourceId: 'node-c006', targetId: 'node-c008', weight: 5 },
  // Security -> Events of Default
  { id: 'edge-014', workspaceId: 'ws-001', sourceId: 'node-c010', targetId: 'node-c008', weight: 3 },
  // Variable -> Clause edges
  { id: 'edge-015', workspaceId: 'ws-001', sourceId: 'node-v001', targetId: 'node-c002', weight: 5 },
  { id: 'edge-016', workspaceId: 'ws-001', sourceId: 'node-v002', targetId: 'node-c003', weight: 5 },
  { id: 'edge-017', workspaceId: 'ws-001', sourceId: 'node-v003', targetId: 'node-c004', weight: 5 },
  { id: 'edge-018', workspaceId: 'ws-001', sourceId: 'node-v004', targetId: 'node-c005', weight: 5 },
  { id: 'edge-019', workspaceId: 'ws-001', sourceId: 'node-v005', targetId: 'node-c006', weight: 5 },
  { id: 'edge-020', workspaceId: 'ws-001', sourceId: 'node-v006', targetId: 'node-c006', weight: 5 },
  { id: 'edge-021', workspaceId: 'ws-001', sourceId: 'node-v007', targetId: 'node-c007', weight: 5 },
  { id: 'edge-022', workspaceId: 'ws-001', sourceId: 'node-v008', targetId: 'node-c011', weight: 5 },
  { id: 'edge-023', workspaceId: 'ws-001', sourceId: 'node-v010', targetId: 'node-c003', weight: 4 },
  // Cross-variable dependencies
  { id: 'edge-024', workspaceId: 'ws-001', sourceId: 'node-v002', targetId: 'node-v008', weight: 3 },
  { id: 'edge-025', workspaceId: 'ws-001', sourceId: 'node-v007', targetId: 'node-v005', weight: 5 },
  { id: 'edge-026', workspaceId: 'ws-001', sourceId: 'node-v007', targetId: 'node-v006', weight: 5 },
  { id: 'edge-027', workspaceId: 'ws-001', sourceId: 'node-v001', targetId: 'node-v004', weight: 2 },
  { id: 'edge-028', workspaceId: 'ws-001', sourceId: 'node-v010', targetId: 'node-v002', weight: 4 },
  // Additional cross-references
  { id: 'edge-029', workspaceId: 'ws-001', sourceId: 'node-c003', targetId: 'node-c011', weight: 3 },
  { id: 'edge-030', workspaceId: 'ws-001', sourceId: 'node-c004', targetId: 'node-c008', weight: 4 },
  { id: 'edge-031', workspaceId: 'ws-001', sourceId: 'node-c005', targetId: 'node-c008', weight: 3 },
  { id: 'edge-032', workspaceId: 'ws-001', sourceId: 'node-v001', targetId: 'node-c003', weight: 3 },
  { id: 'edge-033', workspaceId: 'ws-001', sourceId: 'node-v001', targetId: 'node-c004', weight: 4 },
  { id: 'edge-034', workspaceId: 'ws-001', sourceId: 'node-v003', targetId: 'node-c008', weight: 2 },
  { id: 'edge-035', workspaceId: 'ws-001', sourceId: 'node-v005', targetId: 'node-c008', weight: 5 },
  { id: 'edge-036', workspaceId: 'ws-001', sourceId: 'node-v006', targetId: 'node-c008', weight: 5 },
  // More interconnections
  { id: 'edge-037', workspaceId: 'ws-001', sourceId: 'node-c001', targetId: 'node-c007', weight: 4 },
  { id: 'edge-038', workspaceId: 'ws-001', sourceId: 'node-c001', targetId: 'node-c010', weight: 2 },
  { id: 'edge-039', workspaceId: 'ws-001', sourceId: 'node-c001', targetId: 'node-c011', weight: 3 },
  { id: 'edge-040', workspaceId: 'ws-001', sourceId: 'node-c002', targetId: 'node-c006', weight: 3 },
  { id: 'edge-041', workspaceId: 'ws-001', sourceId: 'node-c002', targetId: 'node-c008', weight: 4 },
  { id: 'edge-042', workspaceId: 'ws-001', sourceId: 'node-c002', targetId: 'node-c010', weight: 4 },
  { id: 'edge-043', workspaceId: 'ws-001', sourceId: 'node-v002', targetId: 'node-c006', weight: 3 },
  { id: 'edge-044', workspaceId: 'ws-001', sourceId: 'node-v001', targetId: 'node-c006', weight: 2 },
  { id: 'edge-045', workspaceId: 'ws-001', sourceId: 'node-c007', targetId: 'node-c008', weight: 3 },
];


// ============================================================================
// DRIFT ITEMS (5 drift items showing deviations)
// ============================================================================
const driftItems: DriftItem[] = [
  {
    id: 'drift-001',
    workspaceId: 'ws-001',
    clauseId: 'clause-003',
    variableId: 'var-002',
    title: 'Applicable Margin Increase',
    type: 'financial',
    severity: 'HIGH',
    baselineValue: '250 bps',
    baselineApprovedAt: '2024-06-01T09:00:00Z',
    currentValue: '275 bps',
    currentModifiedAt: '2024-12-18T09:15:00Z',
    currentModifiedBy: 'user-002',
    status: 'unresolved',
  },
  {
    id: 'drift-002',
    workspaceId: 'ws-001',
    clauseId: 'clause-006',
    variableId: 'var-005',
    title: 'Leverage Ratio Cap Relaxation',
    type: 'covenant',
    severity: 'HIGH',
    baselineValue: '4.00x',
    baselineApprovedAt: '2024-06-01T09:00:00Z',
    currentValue: '4.50x',
    currentModifiedAt: '2024-12-19T14:45:00Z',
    currentModifiedBy: 'user-001',
    status: 'unresolved',
  },
  {
    id: 'drift-003',
    workspaceId: 'ws-001',
    clauseId: 'clause-006',
    variableId: 'var-006',
    title: 'Interest Cover Floor Reduction',
    type: 'covenant',
    severity: 'MEDIUM',
    baselineValue: '3.50x',
    baselineApprovedAt: '2024-06-01T09:00:00Z',
    currentValue: '3.00x',
    currentModifiedAt: '2024-12-19T14:45:00Z',
    currentModifiedBy: 'user-001',
    status: 'approved',
    approvedBy: 'user-003',
    approvedAt: '2024-12-20T10:00:00Z',
    approvalReason: 'Borrower demonstrated strong cash flow generation',
  },
  {
    id: 'drift-004',
    workspaceId: 'ws-001',
    clauseId: 'clause-011',
    variableId: 'var-008',
    title: 'Commitment Fee Increase',
    type: 'financial',
    severity: 'LOW',
    baselineValue: '35%',
    baselineApprovedAt: '2024-06-01T09:00:00Z',
    currentValue: '40%',
    currentModifiedAt: '2024-12-08T15:00:00Z',
    currentModifiedBy: 'user-001',
    status: 'overridden',
    approvedBy: 'user-001',
    approvedAt: '2024-12-09T09:00:00Z',
    approvalReason: 'Market standard adjustment',
  },
  {
    id: 'drift-005',
    workspaceId: 'ws-003',
    clauseId: 'clause-003',
    variableId: 'var-014',
    title: 'TLB Margin Increase',
    type: 'financial',
    severity: 'MEDIUM',
    baselineValue: '325 bps',
    baselineApprovedAt: '2024-10-01T08:30:00Z',
    currentValue: '350 bps',
    currentModifiedAt: '2024-12-18T10:00:00Z',
    currentModifiedBy: 'user-005',
    status: 'unresolved',
  },
];

// ============================================================================
// RECONCILIATION SESSIONS AND ITEMS (3 items)
// ============================================================================
const reconciliationSessions: ReconciliationSession[] = [
  {
    id: 'recon-session-001',
    workspaceId: 'ws-001',
    fileName: 'Borrower_Markup_v3.docx',
    fileType: 'docx',
    uploadedAt: '2024-12-15T14:00:00Z',
    uploadedBy: 'user-002',
    totalItems: 3,
    appliedCount: 1,
    rejectedCount: 1,
    pendingCount: 1,
  },
];

const reconciliationItems: ReconciliationItem[] = [
  {
    id: 'recon-001',
    workspaceId: 'ws-001',
    sessionId: 'recon-session-001',
    incomingSnippet: 'The Applicable Margin shall be 300 basis points per annum.',
    targetClauseId: 'clause-003',
    targetVariableId: 'var-002',
    confidence: 'HIGH',
    baselineValue: '250 bps',
    currentValue: '275 bps',
    proposedValue: '300 bps',
    decision: 'rejected',
    decisionReason: 'Margin increase too aggressive for current market',
    decidedBy: 'user-001',
    decidedAt: '2024-12-16T10:00:00Z',
  },
  {
    id: 'recon-002',
    workspaceId: 'ws-001',
    sessionId: 'recon-session-001',
    incomingSnippet: 'The Borrower may prepay any Loan in whole or in part (but if in part, being an amount that reduces the amount of the Loan by a minimum amount of USD 10,000,000).',
    targetClauseId: 'clause-005',
    targetVariableId: 'var-004',
    confidence: 'MEDIUM',
    baselineValue: '5,000,000 USD',
    currentValue: '5,000,000 USD',
    proposedValue: '10,000,000 USD',
    decision: 'applied',
    decisionReason: 'Acceptable operational change',
    decidedBy: 'user-001',
    decidedAt: '2024-12-16T10:15:00Z',
  },
  {
    id: 'recon-003',
    workspaceId: 'ws-001',
    sessionId: 'recon-session-001',
    incomingSnippet: 'The ratio of Total Net Debt to EBITDA does not exceed 5.00:1.00 at any time.',
    targetClauseId: 'clause-006',
    targetVariableId: 'var-005',
    confidence: 'HIGH',
    baselineValue: '4.00x',
    currentValue: '4.50x',
    proposedValue: '5.00x',
    decision: 'pending',
  },
];


// ============================================================================
// GOLDEN RECORDS
// ============================================================================
const goldenRecords: GoldenRecord[] = [
  {
    workspaceId: 'ws-001',
    status: 'IN_REVIEW',
    integrityScore: 87,
    unresolvedHighDriftCount: 2,
    lastExportAt: '2024-12-19T16:00:00Z',
    lastPublishAt: undefined,
    connectors: [],
    covenants: [],
    schemaJson: JSON.stringify({
      dealName: 'Project Atlas - Senior Secured Facility',
      currency: 'USD',
      amount: 500000000,
      margin: 275,
      tenor: 5,
      leverageRatio: 4.5,
      interestCover: 3.0,
    }),
  },
  {
    workspaceId: 'ws-002',
    status: 'READY',
    integrityScore: 95,
    unresolvedHighDriftCount: 0,
    lastExportAt: '2024-12-18T11:00:00Z',
    lastPublishAt: '2024-12-18T14:00:00Z',
    connectors: [],
    covenants: [],
    schemaJson: JSON.stringify({
      dealName: 'Project Beacon - Revolving Credit',
      currency: 'EUR',
      amount: 250000000,
      margin: 200,
    }),
  },
];

// ============================================================================
// COVENANTS
// ============================================================================
const covenants: Covenant[] = [
  {
    id: 'cov-001',
    workspaceId: 'ws-001',
    name: 'Leverage Ratio',
    testFrequency: 'Quarterly',
    threshold: '≤ 4.50x',
    calculationBasis: 'Total Net Debt / EBITDA',
    clauseId: 'clause-006',
  },
  {
    id: 'cov-002',
    workspaceId: 'ws-001',
    name: 'Interest Cover',
    testFrequency: 'Quarterly',
    threshold: '≥ 3.00x',
    calculationBasis: 'EBITDA / Net Finance Charges',
    clauseId: 'clause-006',
  },
  {
    id: 'cov-003',
    workspaceId: 'ws-002',
    name: 'Leverage Ratio',
    testFrequency: 'Semi-Annual',
    threshold: '≤ 3.50x',
    calculationBasis: 'Total Net Debt / EBITDA',
    clauseId: 'clause-006',
  },
];

// ============================================================================
// DOWNSTREAM CONNECTORS
// ============================================================================
const downstreamConnectors: DownstreamConnector[] = [
  { id: 'conn-001', name: 'LoanIQ Production', type: 'LoanIQ', status: 'READY', lastSyncAt: '2024-12-18T14:00:00Z' },
  { id: 'conn-002', name: 'Finastra Fusion', type: 'Finastra', status: 'READY', lastSyncAt: '2024-12-17T09:00:00Z' },
  { id: 'conn-003', name: 'Allvue Systems', type: 'Allvue', status: 'IN_REVIEW', lastSyncAt: '2024-12-15T11:00:00Z' },
  { id: 'conn-004', name: 'CovenantTracker', type: 'CovenantTracker', status: 'DISCONNECTED', lastSyncAt: undefined },
];


// ============================================================================
// AUDIT EVENTS (30 events)
// ============================================================================
const auditEvents: AuditEvent[] = [
  // Workspace creation events
  { id: 'audit-001', workspaceId: null, timestamp: '2024-06-01T09:00:00Z', actorId: 'user-001', actorName: 'Sarah Chen', eventType: 'WORKSPACE_CREATE', targetType: 'workspace', targetId: 'ws-001', afterState: 'Project Atlas - Senior Secured Facility' },
  { id: 'audit-002', workspaceId: null, timestamp: '2024-08-15T10:00:00Z', actorId: 'user-001', actorName: 'Sarah Chen', eventType: 'WORKSPACE_CREATE', targetType: 'workspace', targetId: 'ws-002', afterState: 'Project Beacon - Revolving Credit' },
  { id: 'audit-003', workspaceId: null, timestamp: '2024-10-01T08:30:00Z', actorId: 'user-005', actorName: 'Emma Brown', eventType: 'WORKSPACE_CREATE', targetType: 'workspace', targetId: 'ws-003', afterState: 'Project Coral - Term Loan B' },
  
  // Member invitations
  { id: 'audit-004', workspaceId: 'ws-001', timestamp: '2024-06-02T10:00:00Z', actorId: 'user-001', actorName: 'Sarah Chen', eventType: 'INVITE_SENT', targetType: 'user', targetId: 'user-002', afterState: 'legal' },
  { id: 'audit-005', workspaceId: 'ws-001', timestamp: '2024-06-03T09:00:00Z', actorId: 'user-001', actorName: 'Sarah Chen', eventType: 'INVITE_SENT', targetType: 'user', targetId: 'user-003', afterState: 'risk' },
  { id: 'audit-006', workspaceId: 'ws-001', timestamp: '2024-06-15T14:00:00Z', actorId: 'user-001', actorName: 'Sarah Chen', eventType: 'INVITE_SENT', targetType: 'user', targetId: 'user-004', afterState: 'investor' },
  
  // Login events
  { id: 'audit-007', workspaceId: null, timestamp: '2024-12-20T08:00:00Z', actorId: 'user-001', actorName: 'Sarah Chen', eventType: 'LOGIN' },
  { id: 'audit-008', workspaceId: null, timestamp: '2024-12-20T08:30:00Z', actorId: 'user-002', actorName: 'James Wilson', eventType: 'LOGIN' },
  { id: 'audit-009', workspaceId: null, timestamp: '2024-12-20T09:00:00Z', actorId: 'user-003', actorName: 'Maria Garcia', eventType: 'LOGIN' },
  
  // Clause edits
  { id: 'audit-010', workspaceId: 'ws-001', timestamp: '2024-12-15T10:30:00Z', actorId: 'user-002', actorName: 'James Wilson', eventType: 'CLAUSE_EDIT', targetType: 'clause', targetId: 'clause-001', beforeState: 'Previous definitions text', afterState: 'Updated definitions text', reason: 'Clarified Business Day definition', reasonCategory: 'legal_requirement' },
  { id: 'audit-011', workspaceId: 'ws-001', timestamp: '2024-12-18T09:15:00Z', actorId: 'user-002', actorName: 'James Wilson', eventType: 'CLAUSE_EDIT', targetType: 'clause', targetId: 'clause-003', beforeState: '250 bps', afterState: '275 bps', reason: 'Borrower requested margin increase', reasonCategory: 'borrower_request' },
  { id: 'audit-012', workspaceId: 'ws-001', timestamp: '2024-12-19T14:45:00Z', actorId: 'user-001', actorName: 'Sarah Chen', eventType: 'CLAUSE_EDIT', targetType: 'clause', targetId: 'clause-006', beforeState: '4.00x / 3.50x', afterState: '4.50x / 3.00x', reason: 'Covenant relaxation per credit committee', reasonCategory: 'credit_update' },
  
  // Variable edits
  { id: 'audit-013', workspaceId: 'ws-001', timestamp: '2024-12-18T09:15:00Z', actorId: 'user-002', actorName: 'James Wilson', eventType: 'VARIABLE_EDIT', targetType: 'variable', targetId: 'var-002', beforeState: '250 bps', afterState: '275 bps' },
  { id: 'audit-014', workspaceId: 'ws-001', timestamp: '2024-12-19T14:45:00Z', actorId: 'user-001', actorName: 'Sarah Chen', eventType: 'VARIABLE_EDIT', targetType: 'variable', targetId: 'var-005', beforeState: '4.00x', afterState: '4.50x' },
  { id: 'audit-015', workspaceId: 'ws-001', timestamp: '2024-12-19T14:45:00Z', actorId: 'user-001', actorName: 'Sarah Chen', eventType: 'VARIABLE_EDIT', targetType: 'variable', targetId: 'var-006', beforeState: '3.50x', afterState: '3.00x' },
  
  // Graph sync events
  { id: 'audit-016', workspaceId: 'ws-001', timestamp: '2024-12-15T11:00:00Z', actorId: 'user-002', actorName: 'James Wilson', eventType: 'GRAPH_SYNC', afterState: 'Integrity: 92%' },
  { id: 'audit-017', workspaceId: 'ws-001', timestamp: '2024-12-18T10:00:00Z', actorId: 'user-002', actorName: 'James Wilson', eventType: 'GRAPH_SYNC', afterState: 'Integrity: 89%' },
  { id: 'audit-018', workspaceId: 'ws-001', timestamp: '2024-12-20T15:30:00Z', actorId: 'user-001', actorName: 'Sarah Chen', eventType: 'GRAPH_SYNC', afterState: 'Integrity: 87%' },
  
  // Drift events
  { id: 'audit-019', workspaceId: 'ws-001', timestamp: '2024-12-09T09:00:00Z', actorId: 'user-001', actorName: 'Sarah Chen', eventType: 'DRIFT_OVERRIDE', targetType: 'drift', targetId: 'drift-004', beforeState: '35%', afterState: '40%', reason: 'Market standard adjustment', reasonCategory: 'market_conditions' },
  { id: 'audit-020', workspaceId: 'ws-001', timestamp: '2024-12-20T10:00:00Z', actorId: 'user-003', actorName: 'Maria Garcia', eventType: 'DRIFT_APPROVE', targetType: 'drift', targetId: 'drift-003', afterState: 'Approved', reason: 'Borrower demonstrated strong cash flow generation', reasonCategory: 'credit_update' },
  
  // Reconciliation events
  { id: 'audit-021', workspaceId: 'ws-001', timestamp: '2024-12-16T10:00:00Z', actorId: 'user-001', actorName: 'Sarah Chen', eventType: 'RECON_REJECT', targetType: 'reconciliation', targetId: 'recon-001', afterState: 'Rejected', reason: 'Margin increase too aggressive for current market', reasonCategory: 'market_conditions' },
  { id: 'audit-022', workspaceId: 'ws-001', timestamp: '2024-12-16T10:15:00Z', actorId: 'user-001', actorName: 'Sarah Chen', eventType: 'RECON_APPLY', targetType: 'reconciliation', targetId: 'recon-002', beforeState: '5,000,000 USD', afterState: '10,000,000 USD', reason: 'Acceptable operational change', reasonCategory: 'borrower_request' },
  
  // Export events
  { id: 'audit-023', workspaceId: 'ws-001', timestamp: '2024-12-19T16:00:00Z', actorId: 'user-001', actorName: 'Sarah Chen', eventType: 'EXPORT_JSON', targetType: 'golden-record', targetId: 'ws-001' },
  { id: 'audit-024', workspaceId: 'ws-002', timestamp: '2024-12-18T11:00:00Z', actorId: 'user-001', actorName: 'Sarah Chen', eventType: 'EXPORT_JSON', targetType: 'golden-record', targetId: 'ws-002' },
  
  // Publish event
  { id: 'audit-025', workspaceId: 'ws-002', timestamp: '2024-12-18T14:00:00Z', actorId: 'user-001', actorName: 'Sarah Chen', eventType: 'PUBLISH', targetType: 'golden-record', targetId: 'ws-002', reason: 'Final terms approved by all parties', reasonCategory: 'other' },
  
  // Governance updates
  { id: 'audit-026', workspaceId: 'ws-001', timestamp: '2024-06-05T10:00:00Z', actorId: 'user-001', actorName: 'Sarah Chen', eventType: 'GOVERNANCE_UPDATED', beforeState: 'legalCanRevertDraft: false', afterState: 'legalCanRevertDraft: true' },
  { id: 'audit-027', workspaceId: 'ws-002', timestamp: '2024-08-20T09:00:00Z', actorId: 'user-001', actorName: 'Sarah Chen', eventType: 'GOVERNANCE_UPDATED', beforeState: 'definitionsLockedAfterApproval: false', afterState: 'definitionsLockedAfterApproval: true' },
  
  // More login events
  { id: 'audit-028', workspaceId: null, timestamp: '2024-12-19T08:00:00Z', actorId: 'user-004', actorName: 'David Kim', eventType: 'LOGIN' },
  { id: 'audit-029', workspaceId: null, timestamp: '2024-12-19T09:30:00Z', actorId: 'user-005', actorName: 'Emma Brown', eventType: 'LOGIN' },
  { id: 'audit-030', workspaceId: null, timestamp: '2024-12-18T07:45:00Z', actorId: 'user-001', actorName: 'Sarah Chen', eventType: 'LOGIN' },
];

// ============================================================================
// ASSEMBLE AND EXPORT SEED DATA
// ============================================================================
export const seedData: DatabaseState = {
  users,
  sessions: [], // No active sessions initially
  workspaces,
  workspaceMembers,
  clauses,
  variables,
  graphNodes,
  graphEdges,
  driftItems,
  reconciliationItems,
  reconciliationSessions,
  goldenRecords,
  auditEvents,
  covenants,
  downstreamConnectors,
};

// Initialize the seed data in mockDb
setSeedData(seedData);

export default seedData;
