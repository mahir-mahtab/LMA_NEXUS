import { PrismaClient, Role, MemberStatus, ClauseType, VariableType, NodeType, DriftSeverity, DriftStatus } from '@prisma/client';
import { hashPassword } from '../src/utils/password.js';

const prisma = new PrismaClient();

/**
 * Demo users matching the frontend mock data
 * Password for all users: Password123
 * 
 */
const users = [
  {
    id: 'user-001',
    email: 'sarah.chen@bankco.com',
    name: 'Sarah Chen',
    avatarUrl: null,
  },
  {
    id: 'user-002',
    email: 'james.wilson@legalfirm.com',
    name: 'James Wilson',
    avatarUrl: null,
  },
  {
    id: 'user-003',
    email: 'maria.garcia@bankco.com',
    name: 'Maria Garcia',
    avatarUrl: null,
  },
  {
    id: 'user-004',
    email: 'david.kim@investco.com',
    name: 'David Kim',
    avatarUrl: null,
  },
  {
    id: 'user-005',
    email: 'emma.brown@bankco.com',
    name: 'Emma Brown',
    avatarUrl: null,
  },
];

/**
 * Demo workspaces matching frontend mock data
 */
const workspaces = [
  {
    id: 'ws-001',
    name: 'Project Atlas - Senior Secured Facility',
    currency: 'USD',
    amount: 500000000,
    standard: 'LMA-style v2024.1',
    basePdfName: 'Atlas_Facility_Agreement_v1.pdf',
    createdById: 'user-001',
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
    createdById: 'user-001',
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
    createdById: 'user-005',
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

/**
 * Demo workspace members matching frontend mock data
 */
const workspaceMembers = [
  // Workspace 1 - Atlas
  { id: 'wm-001', workspaceId: 'ws-001', userId: 'user-001', role: Role.agent, isAdmin: true, status: MemberStatus.active, joinedAt: new Date('2024-06-01T09:00:00Z') },
  { id: 'wm-002', workspaceId: 'ws-001', userId: 'user-002', role: Role.legal, isAdmin: false, status: MemberStatus.active, joinedAt: new Date('2024-06-02T11:00:00Z') },
  { id: 'wm-003', workspaceId: 'ws-001', userId: 'user-003', role: Role.risk, isAdmin: false, status: MemberStatus.active, joinedAt: new Date('2024-06-03T10:00:00Z') },
  { id: 'wm-004', workspaceId: 'ws-001', userId: 'user-004', role: Role.investor, isAdmin: false, status: MemberStatus.active, joinedAt: new Date('2024-06-16T09:00:00Z') },
  // Workspace 2 - Beacon
  { id: 'wm-005', workspaceId: 'ws-002', userId: 'user-001', role: Role.agent, isAdmin: true, status: MemberStatus.active, joinedAt: new Date('2024-08-15T10:00:00Z') },
  { id: 'wm-006', workspaceId: 'ws-002', userId: 'user-002', role: Role.legal, isAdmin: false, status: MemberStatus.active, joinedAt: new Date('2024-08-16T10:00:00Z') },
  { id: 'wm-007', workspaceId: 'ws-002', userId: 'user-003', role: Role.risk, isAdmin: false, status: MemberStatus.active, joinedAt: new Date('2024-08-17T14:00:00Z') },
  // Workspace 3 - Coral
  { id: 'wm-008', workspaceId: 'ws-003', userId: 'user-005', role: Role.agent, isAdmin: true, status: MemberStatus.active, joinedAt: new Date('2024-10-01T08:30:00Z') },
  { id: 'wm-009', workspaceId: 'ws-003', userId: 'user-002', role: Role.legal, isAdmin: false, status: MemberStatus.active, joinedAt: new Date('2024-10-02T10:00:00Z') },
  { id: 'wm-010', workspaceId: 'ws-003', userId: 'user-001', role: Role.agent, isAdmin: false, status: MemberStatus.active, joinedAt: new Date('2024-10-05T14:00:00Z') },
];

/**
 * Demo clauses for testing draft service
 */
const clauses = [
  // Workspace 1 - Atlas
  {
    id: 'clause-001',
    workspaceId: 'ws-001',
    title: 'Facility Amount',
    body: 'The Facility Agent shall make available to the Borrower a senior secured term loan facility in an aggregate principal amount equal to USD 500,000,000 (the "Facility").',
    type: ClauseType.financial,
    order: 1,
    isSensitive: true,
    isLocked: false,
    lastModifiedBy: 'user-001',
  },
  {
    id: 'clause-002',
    workspaceId: 'ws-001',
    title: 'Interest Rate',
    body: 'The rate of interest on each Loan for each Interest Period is the percentage rate per annum which is the aggregate of: (a) the Margin; and (b) SOFR.',
    type: ClauseType.financial,
    order: 2,
    isSensitive: true,
    isLocked: false,
    lastModifiedBy: 'user-001',
  },
  {
    id: 'clause-003',
    workspaceId: 'ws-001',
    title: 'Leverage Ratio Covenant',
    body: 'The Borrower shall ensure that, at the end of each Relevant Period, the ratio of Total Net Debt to EBITDA shall not exceed 3.50:1.00.',
    type: ClauseType.covenant,
    order: 3,
    isSensitive: true,
    isLocked: false,
    lastModifiedBy: 'user-001',
  },
  {
    id: 'clause-004',
    workspaceId: 'ws-001',
    title: 'Definition of EBITDA',
    body: '"EBITDA" means, in relation to any Relevant Period, the consolidated operating profit of the Group for that Relevant Period before taxation, adding back depreciation, amortization, and interest expenses.',
    type: ClauseType.definition,
    order: 4,
    isSensitive: false,
    isLocked: false,
    lastModifiedBy: 'user-001',
  },
  {
    id: 'clause-005',
    workspaceId: 'ws-001',
    title: 'Cross-Reference: Security Documents',
    body: 'The security interests created under the Security Documents (as defined in Clause 1.1) shall secure all Secured Obligations.',
    type: ClauseType.xref,
    order: 5,
    isSensitive: false,
    isLocked: false,
    lastModifiedBy: 'user-001',
  },
  {
    id: 'clause-006',
    workspaceId: 'ws-001',
    title: '6. Financial Covenants',
    body: 'The Borrower shall ensure that:\n\n(a) Leverage Ratio: the ratio of Total Net Debt to EBITDA does not exceed 4.50:1.00 at any time;\n\n(b) Interest Cover: the ratio of EBITDA to Net Finance Charges is not less than 3.00:1.00 in respect of any Relevant Period.',
    type: ClauseType.covenant,
    order: 6,
    isSensitive: true,
    isLocked: false,
    lastModifiedBy: 'user-001',
  },
  {
    id: 'clause-007',
    workspaceId: 'ws-001',
    title: '7. EBITDA Definition',
    body: '"EBITDA" means, in respect of any Relevant Period, the consolidated operating profit of the Group before taxation:\n\n(a) before deducting any interest, commission, fees, discounts, prepayment fees, premiums or charges;\n(b) not including any accrued interest owing to any member of the Group;\n(c) before taking into account any Exceptional Items.',
    type: ClauseType.definition,
    order: 7,
    isSensitive: true,
    isLocked: false,
    lastModifiedBy: 'user-002',
  },
  {
    id: 'clause-008',
    workspaceId: 'ws-001',
    title: '8. Events of Default',
    body: 'Each of the events or circumstances set out in this Clause 8 is an Event of Default:\n\n(a) Non-payment: An Obligor does not pay on the due date any amount payable pursuant to a Finance Document.\n\n(b) Financial covenants: Any requirement of Clause 6 (Financial Covenants) is not satisfied.',
    type: ClauseType.xref,
    order: 8,
    isSensitive: false,
    isLocked: false,
    lastModifiedBy: 'user-002',
  },
  {
    id: 'clause-009',
    workspaceId: 'ws-001',
    title: '9. Representations',
    body: 'Each Obligor makes the representations and warranties set out in this Clause 9 to each Finance Party on the date of this Agreement.',
    type: ClauseType.xref,
    order: 9,
    isSensitive: false,
    isLocked: false,
    lastModifiedBy: 'user-002',
  },
  {
    id: 'clause-010',
    workspaceId: 'ws-001',
    title: '10. Security',
    body: 'The obligations of each Obligor under the Finance Documents are secured by the Transaction Security as described in Schedule 6 (Security Documents).',
    type: ClauseType.xref,
    order: 10,
    isSensitive: false,
    isLocked: false,
    lastModifiedBy: 'user-001',
  },
  {
    id: 'clause-011',
    workspaceId: 'ws-001',
    title: '11. Fees',
    body: 'The Borrower shall pay to the Agent (for the account of each Lender) a commitment fee computed at the rate of 40% of the Applicable Margin on that Lender\'s Available Commitment.',
    type: ClauseType.financial,
    order: 11,
    isSensitive: true,
    isLocked: false,
    lastModifiedBy: 'user-001',
  },
  {
    id: 'clause-012',
    workspaceId: 'ws-001',
    title: '12. Governing Law',
    body: 'This Agreement and any non-contractual obligations arising out of or in connection with it are governed by English law.',
    type: ClauseType.xref,
    order: 12,
    isSensitive: false,
    isLocked: false,
    lastModifiedBy: 'user-002',
  },
  // Workspace 2 - Beacon
  {
    id: 'clause-013',
    workspaceId: 'ws-002',
    title: 'Revolving Commitment',
    body: 'Each Lender shall make available to the Borrower its Revolving Commitment in an aggregate amount not exceeding EUR 250,000,000.',
    type: ClauseType.financial,
    order: 1,
    isSensitive: true,
    isLocked: false,
    lastModifiedBy: 'user-001',
  },
  {
    id: 'clause-014',
    workspaceId: 'ws-002',
    title: 'Interest Coverage Ratio',
    body: 'The Borrower shall ensure that, at the end of each Relevant Period, the ratio of EBITDA to Net Finance Charges shall not be less than 4.00:1.00.',
    type: ClauseType.covenant,
    order: 2,
    isSensitive: true,
    isLocked: false,
    lastModifiedBy: 'user-001',
  },
];

/**
 * Demo variables for testing draft service
 */
const variables = [
  {
    id: 'var-001',
    workspaceId: 'ws-001',
    clauseId: 'clause-002',
    label: 'Facility Amount',
    type: VariableType.financial,
    value: '500000000',
    unit: 'USD',
    baselineValue: '500000000',
    lastModifiedBy: 'user-001',
  },
  {
    id: 'var-002',
    workspaceId: 'ws-001',
    clauseId: 'clause-003',
    label: 'Applicable Margin',
    type: VariableType.financial,
    value: '275',
    unit: 'bps',
    baselineValue: '250',
    lastModifiedBy: 'user-002',
  },
  {
    id: 'var-003',
    workspaceId: 'ws-001',
    clauseId: 'clause-004',
    label: 'Tenor',
    type: VariableType.financial,
    value: '5',
    unit: 'years',
    baselineValue: '5',
    lastModifiedBy: 'user-001',
  },
  {
    id: 'var-004',
    workspaceId: 'ws-001',
    clauseId: 'clause-005',
    label: 'Minimum Prepayment',
    type: VariableType.financial,
    value: '5000000',
    unit: 'USD',
    baselineValue: '5000000',
    lastModifiedBy: 'user-002',
  },
  {
    id: 'var-005',
    workspaceId: 'ws-001',
    clauseId: 'clause-006',
    label: 'Leverage Ratio Cap',
    type: VariableType.covenant,
    value: '4.50',
    unit: 'x',
    baselineValue: '4.00',
    lastModifiedBy: 'user-001',
  },
  {
    id: 'var-006',
    workspaceId: 'ws-001',
    clauseId: 'clause-006',
    label: 'Interest Cover Floor',
    type: VariableType.covenant,
    value: '3.00',
    unit: 'x',
    baselineValue: '3.50',
    lastModifiedBy: 'user-001',
  },
  {
    id: 'var-007',
    workspaceId: 'ws-001',
    clauseId: 'clause-007',
    label: 'EBITDA Definition',
    type: VariableType.definition,
    value: 'Consolidated operating profit before interest, tax, depreciation, amortization, and exceptional items',
    unit: undefined,
    baselineValue: 'Consolidated operating profit before interest, tax, depreciation, amortization, and exceptional items',
    lastModifiedBy: 'user-002',
  },
  {
    id: 'var-008',
    workspaceId: 'ws-001',
    clauseId: 'clause-011',
    label: 'Commitment Fee Rate',
    type: VariableType.financial,
    value: '40',
    unit: '%',
    baselineValue: '35',
    lastModifiedBy: 'user-001',
  },
  {
    id: 'var-009',
    workspaceId: 'ws-001',
    clauseId: 'clause-001',
    label: 'Business Day Definition',
    type: VariableType.definition,
    value: 'London and New York',
    unit: undefined,
    baselineValue: 'London and New York',
    lastModifiedBy: 'user-002',
  },
  {
    id: 'var-010',
    workspaceId: 'ws-001',
    clauseId: 'clause-003',
    label: 'Reference Rate',
    type: VariableType.financial,
    value: 'SOFR',
    unit: undefined,
    baselineValue: 'SOFR',
    lastModifiedBy: 'user-002',
  },
  {
    id: 'var-011',
    workspaceId: 'ws-002',
    clauseId: 'clause-013',
    label: 'RCF Commitment',
    type: VariableType.financial,
    value: '250000000',
    unit: 'EUR',
    baselineValue: '250000000',
    lastModifiedBy: 'user-001',
  },
  {
    id: 'var-012',
    workspaceId: 'ws-002',
    clauseId: 'clause-014',
    label: 'RCF Margin',
    type: VariableType.financial,
    value: '200',
    unit: 'bps',
    baselineValue: '200',
    lastModifiedBy: 'user-001',
  },
  {
    id: 'var-013',
    workspaceId: 'ws-003',
    clauseId: 'clause-002',
    label: 'TLB Amount',
    type: VariableType.financial,
    value: '175000000',
    unit: 'GBP',
    baselineValue: '175000000',
    lastModifiedBy: 'user-001',
  },
  {
    id: 'var-014',
    workspaceId: 'ws-003',
    clauseId: 'clause-003',
    label: 'TLB Margin',
    type: VariableType.financial,
    value: '350',
    unit: 'bps',
    baselineValue: '325',
    lastModifiedBy: 'user-005',
  },
  {
    id: 'var-015',
    workspaceId: 'ws-003',
    clauseId: 'clause-006',
    label: 'TLB Leverage Cap',
    type: VariableType.covenant,
    value: '5.00',
    unit: 'x',
    baselineValue: '5.00',
    lastModifiedBy: 'user-005',
  },
];

/**
 * Graph nodes - derived from clauses and variables (from mock/seed.ts)
 */
const graphNodes = [
  // Clause nodes for ws-001
  { id: 'node-c001', workspaceId: 'ws-001', label: 'Definitions', type: NodeType.definition, clauseId: 'clause-001', variableId: null, value: null, hasDrift: false, hasWarning: false },
  { id: 'node-c002', workspaceId: 'ws-001', label: 'The Facility', type: NodeType.financial, clauseId: 'clause-002', variableId: null, value: null, hasDrift: false, hasWarning: false },
  { id: 'node-c003', workspaceId: 'ws-001', label: 'Interest', type: NodeType.financial, clauseId: 'clause-003', variableId: null, value: null, hasDrift: true, hasWarning: true },
  { id: 'node-c004', workspaceId: 'ws-001', label: 'Repayment', type: NodeType.financial, clauseId: 'clause-004', variableId: null, value: null, hasDrift: false, hasWarning: false },
  { id: 'node-c005', workspaceId: 'ws-001', label: 'Prepayment', type: NodeType.financial, clauseId: 'clause-005', variableId: null, value: null, hasDrift: false, hasWarning: false },
  { id: 'node-c006', workspaceId: 'ws-001', label: 'Financial Covenants', type: NodeType.covenant, clauseId: 'clause-006', variableId: null, value: null, hasDrift: true, hasWarning: true },
  { id: 'node-c007', workspaceId: 'ws-001', label: 'EBITDA Definition', type: NodeType.definition, clauseId: 'clause-007', variableId: null, value: null, hasDrift: false, hasWarning: false },
  { id: 'node-c008', workspaceId: 'ws-001', label: 'Events of Default', type: NodeType.xref, clauseId: 'clause-008', variableId: null, value: null, hasDrift: false, hasWarning: false },
  { id: 'node-c009', workspaceId: 'ws-001', label: 'Representations', type: NodeType.xref, clauseId: 'clause-009', variableId: null, value: null, hasDrift: false, hasWarning: false },
  { id: 'node-c010', workspaceId: 'ws-001', label: 'Security', type: NodeType.xref, clauseId: 'clause-010', variableId: null, value: null, hasDrift: false, hasWarning: false },
  { id: 'node-c011', workspaceId: 'ws-001', label: 'Fees', type: NodeType.financial, clauseId: 'clause-011', variableId: null, value: null, hasDrift: true, hasWarning: false },
  { id: 'node-c012', workspaceId: 'ws-001', label: 'Governing Law', type: NodeType.xref, clauseId: 'clause-012', variableId: null, value: null, hasDrift: false, hasWarning: false },
  // Clause nodes for ws-002
  { id: 'node-c013', workspaceId: 'ws-002', label: 'Revolving Commitment', type: NodeType.financial, clauseId: 'clause-013', variableId: null, value: null, hasDrift: false, hasWarning: false },
  { id: 'node-c014', workspaceId: 'ws-002', label: 'Interest Coverage Ratio', type: NodeType.covenant, clauseId: 'clause-014', variableId: null, value: null, hasDrift: false, hasWarning: false },
  // Variable nodes for ws-001
  { id: 'node-v001', workspaceId: 'ws-001', label: 'Facility Amount', type: NodeType.financial, clauseId: null, variableId: 'var-001', value: '500,000,000 USD', hasDrift: false, hasWarning: false },
  { id: 'node-v002', workspaceId: 'ws-001', label: 'Applicable Margin', type: NodeType.financial, clauseId: null, variableId: 'var-002', value: '275 bps', hasDrift: true, hasWarning: true },
  { id: 'node-v003', workspaceId: 'ws-001', label: 'Tenor', type: NodeType.financial, clauseId: null, variableId: 'var-003', value: '5 years', hasDrift: false, hasWarning: false },
  { id: 'node-v004', workspaceId: 'ws-001', label: 'Min Prepayment', type: NodeType.financial, clauseId: null, variableId: 'var-004', value: '5,000,000 USD', hasDrift: false, hasWarning: false },
  { id: 'node-v005', workspaceId: 'ws-001', label: 'Leverage Ratio Cap', type: NodeType.covenant, clauseId: null, variableId: 'var-005', value: '4.50x', hasDrift: true, hasWarning: true },
  { id: 'node-v006', workspaceId: 'ws-001', label: 'Interest Cover Floor', type: NodeType.covenant, clauseId: null, variableId: 'var-006', value: '3.00x', hasDrift: true, hasWarning: false },
  { id: 'node-v007', workspaceId: 'ws-001', label: 'EBITDA', type: NodeType.definition, clauseId: null, variableId: 'var-007', value: null, hasDrift: false, hasWarning: false },
  { id: 'node-v008', workspaceId: 'ws-001', label: 'Commitment Fee', type: NodeType.financial, clauseId: null, variableId: 'var-008', value: '40%', hasDrift: true, hasWarning: false },
  { id: 'node-v009', workspaceId: 'ws-001', label: 'Business Day Definition', type: NodeType.definition, clauseId: null, variableId: 'var-009', value: null, hasDrift: false, hasWarning: false },
  { id: 'node-v010', workspaceId: 'ws-001', label: 'Reference Rate', type: NodeType.financial, clauseId: null, variableId: 'var-010', value: 'SOFR', hasDrift: false, hasWarning: false },
  // Variable nodes for ws-002
  { id: 'node-v011', workspaceId: 'ws-002', label: 'RCF Commitment', type: NodeType.financial, clauseId: null, variableId: 'var-011', value: '250,000,000 EUR', hasDrift: false, hasWarning: false },
  { id: 'node-v012', workspaceId: 'ws-002', label: 'RCF Margin', type: NodeType.financial, clauseId: null, variableId: 'var-012', value: '200 bps', hasDrift: false, hasWarning: false },
  // Variable nodes for ws-003
  { id: 'node-v013', workspaceId: 'ws-003', label: 'TLB Amount', type: NodeType.financial, clauseId: null, variableId: 'var-013', value: '175,000,000 GBP', hasDrift: false, hasWarning: false },
  { id: 'node-v014', workspaceId: 'ws-003', label: 'TLB Margin', type: NodeType.financial, clauseId: null, variableId: 'var-014', value: '350 bps', hasDrift: true, hasWarning: false },
  { id: 'node-v015', workspaceId: 'ws-003', label: 'TLB Leverage Cap', type: NodeType.covenant, clauseId: null, variableId: 'var-015', value: '5.00x', hasDrift: false, hasWarning: false },
];

/**
 * Graph edges - showing dependencies between nodes
 */
const graphEdges = [
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
  // ws-002 edges: Financial -> Covenant
  { id: 'edge-046', workspaceId: 'ws-002', sourceId: 'node-c013', targetId: 'node-c014', weight: 4 },
  // ws-002: Variable -> Clause edges
  { id: 'edge-047', workspaceId: 'ws-002', sourceId: 'node-v011', targetId: 'node-c013', weight: 5 },
  { id: 'edge-048', workspaceId: 'ws-002', sourceId: 'node-v012', targetId: 'node-c014', weight: 5 },
  // Cross-variable dependencies in ws-002
  { id: 'edge-049', workspaceId: 'ws-002', sourceId: 'node-v011', targetId: 'node-v012', weight: 3 },
];

/**
 * Drift items - showing deviations from baseline
 */
const driftItems = [
  {
    id: 'drift-001',
    workspaceId: 'ws-001',
    clauseId: 'clause-003',
    variableId: 'var-002',
    title: 'Applicable Margin Increase',
    type: ClauseType.financial,
    severity: DriftSeverity.HIGH,
    baselineValue: '250 bps',
    baselineApprovedAt: new Date('2024-06-01T09:00:00Z'),
    currentValue: '275 bps',
    currentModifiedAt: new Date('2024-12-18T09:15:00Z'),
    currentModifiedBy: 'user-002',
    status: DriftStatus.unresolved,
  },
  {
    id: 'drift-002',
    workspaceId: 'ws-001',
    clauseId: 'clause-006',
    variableId: 'var-005',
    title: 'Leverage Ratio Cap Relaxation',
    type: ClauseType.covenant,
    severity: DriftSeverity.HIGH,
    baselineValue: '4.00x',
    baselineApprovedAt: new Date('2024-06-01T09:00:00Z'),
    currentValue: '4.50x',
    currentModifiedAt: new Date('2024-12-19T14:45:00Z'),
    currentModifiedBy: 'user-001',
    status: DriftStatus.unresolved,
  },
  {
    id: 'drift-003',
    workspaceId: 'ws-001',
    clauseId: 'clause-006',
    variableId: 'var-006',
    title: 'Interest Cover Floor Reduction',
    type: ClauseType.covenant,
    severity: DriftSeverity.MEDIUM,
    baselineValue: '3.50x',
    baselineApprovedAt: new Date('2024-06-01T09:00:00Z'),
    currentValue: '3.00x',
    currentModifiedAt: new Date('2024-12-19T14:45:00Z'),
    currentModifiedBy: 'user-001',
    status: DriftStatus.approved,
    approvedBy: 'user-003',
    approvedAt: new Date('2024-12-20T10:00:00Z'),
    approvalReason: 'Borrower demonstrated strong cash flow generation',
  },
  {
    id: 'drift-004',
    workspaceId: 'ws-001',
    clauseId: 'clause-011',
    variableId: 'var-008',
    title: 'Commitment Fee Increase',
    type: ClauseType.financial,
    severity: DriftSeverity.LOW,
    baselineValue: '35%',
    baselineApprovedAt: new Date('2024-06-01T09:00:00Z'),
    currentValue: '40%',
    currentModifiedAt: new Date('2024-12-08T15:00:00Z'),
    currentModifiedBy: 'user-001',
    status: DriftStatus.overridden,
    approvedBy: 'user-001',
    approvedAt: new Date('2024-12-09T09:00:00Z'),
    approvalReason: 'Market standard adjustment',
  },
  {
    id: 'drift-005',
    workspaceId: 'ws-003',
    clauseId: 'clause-003',
    variableId: 'var-014',
    title: 'TLB Margin Increase',
    type: ClauseType.financial,
    severity: DriftSeverity.MEDIUM,
    baselineValue: '325 bps',
    baselineApprovedAt: new Date('2024-10-01T08:30:00Z'),
    currentValue: '350 bps',
    currentModifiedAt: new Date('2024-12-18T10:00:00Z'),
    currentModifiedBy: 'user-005',
    status: DriftStatus.unresolved,
  },
];

/**
 * Reconciliation sessions and items
 */
const reconciliationSessions = [
  {
    id: 'recon-session-001',
    workspaceId: 'ws-001',
    fileName: 'Borrower_Markup_v3.docx',
    fileType: 'docx',
    uploadedAt: new Date('2024-12-15T14:00:00Z'),
    uploadedBy: 'user-002',
    totalItems: 3,
    appliedCount: 1,
    rejectedCount: 1,
    pendingCount: 1,
  },
];

const reconciliationItems = [
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
    decidedAt: new Date('2024-12-16T10:00:00Z'),
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
    decidedAt: new Date('2024-12-16T10:15:00Z'),
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

/**
 * Golden records
 */
const goldenRecords = [
  {
    workspaceId: 'ws-001',
    status: 'IN_REVIEW',
    integrityScore: 87,
    unresolvedHighDriftCount: 2,
    lastExportAt: new Date('2024-12-19T16:00:00Z'),
    lastPublishAt: null,
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
    lastExportAt: new Date('2024-12-18T11:00:00Z'),
    lastPublishAt: new Date('2024-12-18T14:00:00Z'),
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

/**
 * Covenants
 */
const covenants = [
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
    clauseId: 'clause-014',
  },
];

/**
 * Downstream connectors
 */
const downstreamConnectors = [
  { id: 'conn-001', name: 'LoanIQ Production', type: 'LoanIQ', status: 'READY', lastSyncAt: new Date('2024-12-18T14:00:00Z') },
  { id: 'conn-002', name: 'Finastra Fusion', type: 'Finastra', status: 'READY', lastSyncAt: new Date('2024-12-17T09:00:00Z') },
  { id: 'conn-003', name: 'Allvue Systems', type: 'Allvue', status: 'IN_REVIEW', lastSyncAt: new Date('2024-12-15T11:00:00Z') },
  { id: 'conn-004', name: 'CovenantTracker', type: 'CovenantTracker', status: 'DISCONNECTED', lastSyncAt: null },
];

/**
 * Audit events (30 events)
 */
const auditEvents = [
  // Workspace creation events
  { id: 'audit-001', workspaceId: null, timestamp: new Date('2024-06-01T09:00:00Z'), actorId: 'user-001', actorName: 'Sarah Chen', eventType: 'WORKSPACE_CREATE', targetType: 'workspace', targetId: 'ws-001', afterState: 'Project Atlas - Senior Secured Facility' },
  { id: 'audit-002', workspaceId: null, timestamp: new Date('2024-08-15T10:00:00Z'), actorId: 'user-001', actorName: 'Sarah Chen', eventType: 'WORKSPACE_CREATE', targetType: 'workspace', targetId: 'ws-002', afterState: 'Project Beacon - Revolving Credit' },
  { id: 'audit-003', workspaceId: null, timestamp: new Date('2024-10-01T08:30:00Z'), actorId: 'user-005', actorName: 'Emma Brown', eventType: 'WORKSPACE_CREATE', targetType: 'workspace', targetId: 'ws-003', afterState: 'Project Coral - Term Loan B' },
  
  // Member invitations
  { id: 'audit-004', workspaceId: 'ws-001', timestamp: new Date('2024-06-02T10:00:00Z'), actorId: 'user-001', actorName: 'Sarah Chen', eventType: 'INVITE_SENT', targetType: 'user', targetId: 'user-002', afterState: 'legal' },
  { id: 'audit-005', workspaceId: 'ws-001', timestamp: new Date('2024-06-03T09:00:00Z'), actorId: 'user-001', actorName: 'Sarah Chen', eventType: 'INVITE_SENT', targetType: 'user', targetId: 'user-003', afterState: 'risk' },
  { id: 'audit-006', workspaceId: 'ws-001', timestamp: new Date('2024-06-15T14:00:00Z'), actorId: 'user-001', actorName: 'Sarah Chen', eventType: 'INVITE_SENT', targetType: 'user', targetId: 'user-004', afterState: 'investor' },
  
  // Login events
  { id: 'audit-007', workspaceId: null, timestamp: new Date('2024-12-20T08:00:00Z'), actorId: 'user-001', actorName: 'Sarah Chen', eventType: 'LOGIN' },
  { id: 'audit-008', workspaceId: null, timestamp: new Date('2024-12-20T08:30:00Z'), actorId: 'user-002', actorName: 'James Wilson', eventType: 'LOGIN' },
  { id: 'audit-009', workspaceId: null, timestamp: new Date('2024-12-20T09:00:00Z'), actorId: 'user-003', actorName: 'Maria Garcia', eventType: 'LOGIN' },
  
  // Clause edits
  { id: 'audit-010', workspaceId: 'ws-001', timestamp: new Date('2024-12-15T10:30:00Z'), actorId: 'user-002', actorName: 'James Wilson', eventType: 'CLAUSE_EDIT', targetType: 'clause', targetId: 'clause-001', beforeState: 'Previous definitions text', afterState: 'Updated definitions text', reason: 'Clarified Business Day definition', reasonCategory: 'legal_requirement' },
  { id: 'audit-011', workspaceId: 'ws-001', timestamp: new Date('2024-12-18T09:15:00Z'), actorId: 'user-002', actorName: 'James Wilson', eventType: 'CLAUSE_EDIT', targetType: 'clause', targetId: 'clause-003', beforeState: '250 bps', afterState: '275 bps', reason: 'Borrower requested margin increase', reasonCategory: 'borrower_request' },
  { id: 'audit-012', workspaceId: 'ws-001', timestamp: new Date('2024-12-19T14:45:00Z'), actorId: 'user-001', actorName: 'Sarah Chen', eventType: 'CLAUSE_EDIT', targetType: 'clause', targetId: 'clause-006', beforeState: '4.00x / 3.50x', afterState: '4.50x / 3.00x', reason: 'Covenant relaxation per credit committee', reasonCategory: 'credit_update' },
  
  // Variable edits
  { id: 'audit-013', workspaceId: 'ws-001', timestamp: new Date('2024-12-18T09:15:00Z'), actorId: 'user-002', actorName: 'James Wilson', eventType: 'VARIABLE_EDIT', targetType: 'variable', targetId: 'var-002', beforeState: '250 bps', afterState: '275 bps' },
  { id: 'audit-014', workspaceId: 'ws-001', timestamp: new Date('2024-12-19T14:45:00Z'), actorId: 'user-001', actorName: 'Sarah Chen', eventType: 'VARIABLE_EDIT', targetType: 'variable', targetId: 'var-005', beforeState: '4.00x', afterState: '4.50x' },
  { id: 'audit-015', workspaceId: 'ws-001', timestamp: new Date('2024-12-19T14:45:00Z'), actorId: 'user-001', actorName: 'Sarah Chen', eventType: 'VARIABLE_EDIT', targetType: 'variable', targetId: 'var-006', beforeState: '3.50x', afterState: '3.00x' },
  
  // Graph sync events
  { id: 'audit-016', workspaceId: 'ws-001', timestamp: new Date('2024-12-15T11:00:00Z'), actorId: 'user-002', actorName: 'James Wilson', eventType: 'GRAPH_SYNC', afterState: 'Integrity: 92%' },
  { id: 'audit-017', workspaceId: 'ws-001', timestamp: new Date('2024-12-18T10:00:00Z'), actorId: 'user-002', actorName: 'James Wilson', eventType: 'GRAPH_SYNC', afterState: 'Integrity: 89%' },
  { id: 'audit-018', workspaceId: 'ws-001', timestamp: new Date('2024-12-20T15:30:00Z'), actorId: 'user-001', actorName: 'Sarah Chen', eventType: 'GRAPH_SYNC', afterState: 'Integrity: 87%' },
  
  // Drift events
  { id: 'audit-019', workspaceId: 'ws-001', timestamp: new Date('2024-12-09T09:00:00Z'), actorId: 'user-001', actorName: 'Sarah Chen', eventType: 'DRIFT_OVERRIDE', targetType: 'drift', targetId: 'drift-004', beforeState: '35%', afterState: '40%', reason: 'Market standard adjustment', reasonCategory: 'market_conditions' },
  { id: 'audit-020', workspaceId: 'ws-001', timestamp: new Date('2024-12-20T10:00:00Z'), actorId: 'user-003', actorName: 'Maria Garcia', eventType: 'DRIFT_APPROVE', targetType: 'drift', targetId: 'drift-003', afterState: 'Approved', reason: 'Borrower demonstrated strong cash flow generation', reasonCategory: 'credit_update' },
  
  // Reconciliation events
  { id: 'audit-021', workspaceId: 'ws-001', timestamp: new Date('2024-12-16T10:00:00Z'), actorId: 'user-001', actorName: 'Sarah Chen', eventType: 'RECON_REJECT', targetType: 'reconciliation', targetId: 'recon-001', afterState: 'Rejected', reason: 'Margin increase too aggressive for current market', reasonCategory: 'market_conditions' },
  { id: 'audit-022', workspaceId: 'ws-001', timestamp: new Date('2024-12-16T10:15:00Z'), actorId: 'user-001', actorName: 'Sarah Chen', eventType: 'RECON_APPLY', targetType: 'reconciliation', targetId: 'recon-002', beforeState: '5,000,000 USD', afterState: '10,000,000 USD', reason: 'Acceptable operational change', reasonCategory: 'borrower_request' },
  
  // Export events
  { id: 'audit-023', workspaceId: 'ws-001', timestamp: new Date('2024-12-19T16:00:00Z'), actorId: 'user-001', actorName: 'Sarah Chen', eventType: 'EXPORT_JSON', targetType: 'golden-record', targetId: 'ws-001' },
  { id: 'audit-024', workspaceId: 'ws-002', timestamp: new Date('2024-12-18T11:00:00Z'), actorId: 'user-001', actorName: 'Sarah Chen', eventType: 'EXPORT_JSON', targetType: 'golden-record', targetId: 'ws-002' },
  
  // Publish event
  { id: 'audit-025', workspaceId: 'ws-002', timestamp: new Date('2024-12-18T14:00:00Z'), actorId: 'user-001', actorName: 'Sarah Chen', eventType: 'PUBLISH', targetType: 'golden-record', targetId: 'ws-002', reason: 'Final terms approved by all parties', reasonCategory: 'other' },
  
  // Governance updates
  { id: 'audit-026', workspaceId: 'ws-001', timestamp: new Date('2024-06-05T10:00:00Z'), actorId: 'user-001', actorName: 'Sarah Chen', eventType: 'GOVERNANCE_UPDATED', beforeState: 'legalCanRevertDraft: false', afterState: 'legalCanRevertDraft: true' },
  { id: 'audit-027', workspaceId: 'ws-002', timestamp: new Date('2024-08-20T09:00:00Z'), actorId: 'user-001', actorName: 'Sarah Chen', eventType: 'GOVERNANCE_UPDATED', beforeState: 'definitionsLockedAfterApproval: false', afterState: 'definitionsLockedAfterApproval: true' },
  
  // More login events
  { id: 'audit-028', workspaceId: null, timestamp: new Date('2024-12-19T08:00:00Z'), actorId: 'user-004', actorName: 'David Kim', eventType: 'LOGIN' },
  { id: 'audit-029', workspaceId: null, timestamp: new Date('2024-12-19T09:30:00Z'), actorId: 'user-005', actorName: 'Emma Brown', eventType: 'LOGIN' },
  { id: 'audit-030', workspaceId: null, timestamp: new Date('2024-12-18T07:45:00Z'), actorId: 'user-001', actorName: 'Sarah Chen', eventType: 'LOGIN' },
];

async function main() {
  console.log('🌱 Starting database seed with workspaces and members...\n');

  const passwordHash = await hashPassword('Password123');

  // Seed Users
  console.log('👤 Seeding users...');
  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        avatarUrl: user.avatarUrl,
        password: passwordHash,
      },
      create: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        password: passwordHash,
      },
    });
    console.log(`  ✓ ${user.email}`);
  }

  // Seed Workspaces
  console.log('\n🏢 Seeding workspaces...');
  for (const workspace of workspaces) {
    await prisma.workspace.upsert({
      where: { id: workspace.id },
      update: {
        name: workspace.name,
        currency: workspace.currency,
        amount: workspace.amount,
        standard: workspace.standard,
        basePdfName: workspace.basePdfName,
        governanceRules: workspace.governanceRules,
      },
      create: {
        id: workspace.id,
        name: workspace.name,
        currency: workspace.currency,
        amount: workspace.amount,
        standard: workspace.standard,
        basePdfName: workspace.basePdfName,
        createdById: workspace.createdById,
        governanceRules: workspace.governanceRules,
      },
    });
    console.log(`  ✓ ${workspace.name}`);
  }

  // Seed Workspace Members
  console.log('\n👥 Seeding workspace members...');
  for (const member of workspaceMembers) {
    await prisma.workspaceMember.upsert({
      where: { 
        userId_workspaceId: {
          userId: member.userId,
          workspaceId: member.workspaceId,
        },
      },
      update: {
        role: member.role,
        isAdmin: member.isAdmin,
        status: member.status,
        joinedAt: member.joinedAt,
      },
      create: {
        id: member.id,
        workspaceId: member.workspaceId,
        userId: member.userId,
        role: member.role,
        isAdmin: member.isAdmin,
        status: member.status,
        joinedAt: member.joinedAt,
      },
    });
  }
  console.log(`  ✓ ${workspaceMembers.length} members across all workspaces`);

  // Seed Clauses
  console.log('\n📝 Seeding clauses...');
  for (const clause of clauses) {
    await prisma.clause.upsert({
      where: { id: clause.id },
      update: {
        title: clause.title,
        body: clause.body,
        type: clause.type,
        order: clause.order,
        isSensitive: clause.isSensitive,
        isLocked: clause.isLocked,
      },
      create: {
        id: clause.id,
        workspaceId: clause.workspaceId,
        title: clause.title,
        body: clause.body,
        type: clause.type,
        order: clause.order,
        isSensitive: clause.isSensitive,
        isLocked: clause.isLocked,
        lastModifiedBy: clause.lastModifiedBy,
      },
    });
  }
  console.log(`  ✓ ${clauses.length} clauses`);

  // Seed Variables
  console.log('\n🔢 Seeding variables...');
  for (const variable of variables) {
    await prisma.variable.upsert({
      where: { id: variable.id },
      update: {
        label: variable.label,
        type: variable.type,
        value: variable.value,
        unit: variable.unit,
        baselineValue: variable.baselineValue,
      },
      create: {
        id: variable.id,
        workspaceId: variable.workspaceId,
        clauseId: variable.clauseId,
        label: variable.label,
        type: variable.type,
        value: variable.value,
        unit: variable.unit,
        baselineValue: variable.baselineValue,
        lastModifiedBy: variable.lastModifiedBy,
      },
    });
  }
  console.log(`  ✓ ${variables.length} variables`);

  // Seed Graph Nodes
  console.log('\n🔗 Seeding graph nodes...');
  // First, clear existing graph data for clean reseed
  await prisma.graphEdge.deleteMany({});
  await prisma.graphNode.deleteMany({});
  await prisma.graphState.deleteMany({});

  for (const node of graphNodes) {
    await prisma.graphNode.create({
      data: {
        id: node.id,
        workspaceId: node.workspaceId,
        label: node.label,
        type: node.type,
        clauseId: node.clauseId,
        variableId: node.variableId,
        value: node.value,
        hasDrift: node.hasDrift,
        hasWarning: node.hasWarning,
      },
    });
  }
  console.log(`  ✓ ${graphNodes.length} graph nodes`);

  // Seed Graph Edges
  console.log('\n🔀 Seeding graph edges...');
  for (const edge of graphEdges) {
    await prisma.graphEdge.create({
      data: {
        id: edge.id,
        workspaceId: edge.workspaceId,
        sourceId: edge.sourceId,
        targetId: edge.targetId,
        weight: edge.weight,
      },
    });
  }
  console.log(`  ✓ ${graphEdges.length} graph edges`);

  // Seed Graph State for each workspace
  console.log('\n📊 Seeding graph state...');
  const workspaceIds = ['ws-001', 'ws-002', 'ws-003'];
  for (const wsId of workspaceIds) {
    const wsNodes = graphNodes.filter(n => n.workspaceId === wsId);
    const nodesWithDrift = wsNodes.filter(n => n.hasDrift).length;
    const nodesWithWarning = wsNodes.filter(n => n.hasWarning).length;
    const totalNodes = wsNodes.length;
    
    let integrityScore = 100;
    if (totalNodes > 0) {
      const driftPenalty = (nodesWithDrift / totalNodes) * 30;
      const warningPenalty = (nodesWithWarning / totalNodes) * 20;
      integrityScore = Math.max(0, Math.round(100 - driftPenalty - warningPenalty));
    }

    await prisma.graphState.create({
      data: {
        workspaceId: wsId,
        integrityScore,
        lastComputedAt: new Date(),
      },
    });
  }
  console.log(`  ✓ ${workspaceIds.length} graph states`);

  // Seed Drift Items
  console.log('\n⚠️ Seeding drift items...');
  // Clear existing drift items
  await prisma.driftItem.deleteMany({});

  for (const drift of driftItems) {
    await prisma.driftItem.create({
      data: {
        id: drift.id,
        workspaceId: drift.workspaceId,
        clauseId: drift.clauseId,
        variableId: drift.variableId,
        title: drift.title,
        type: drift.type,
        severity: drift.severity,
        baselineValue: drift.baselineValue,
        baselineApprovedAt: drift.baselineApprovedAt,
        currentValue: drift.currentValue,
        currentModifiedAt: drift.currentModifiedAt,
        currentModifiedBy: drift.currentModifiedBy,
        status: drift.status,
        approvedBy: drift.approvedBy || null,
        approvedAt: drift.approvedAt || null,
        approvalReason: drift.approvalReason || null,
      },
    });
  }
  console.log(`  ✓ ${driftItems.length} drift items`);

  // Seed Audit Events
  console.log('\n📋 Seeding audit events...');
  for (const event of auditEvents) {
    await prisma.auditEvent.create({
      data: {
        id: event.id,
        workspaceId: event.workspaceId,
        timestamp: event.timestamp,
        actorId: event.actorId,
        actorName: event.actorName,
        eventType: event.eventType,
        targetType: event.targetType,
        targetId: event.targetId,
        beforeState: event.beforeState || null,
        afterState: event.afterState || null,
        reason: event.reason || null,
        reasonCategory: event.reasonCategory || null,
      },
    });
  }
  console.log(`  ✓ ${auditEvents.length} audit events`);

  console.log(`\n✅ Seed complete!`);
  console.log(`   • ${users.length} users (password: Password123)`);
  console.log(`   • ${workspaces.length} workspaces`);
  console.log(`   • ${workspaceMembers.length} workspace members`);
  console.log(`   • ${clauses.length} clauses`);
  console.log(`   • ${variables.length} variables`);
  console.log(`   • ${graphNodes.length} graph nodes`);
  console.log(`   • ${graphEdges.length} graph edges`);
  console.log(`   • ${driftItems.length} drift items`);
  console.log(`   • ${reconciliationSessions.length} reconciliation sessions`);
  console.log(`   • ${reconciliationItems.length} reconciliation items`);
  console.log(`   • ${goldenRecords.length} golden records`);
  console.log(`   • ${covenants.length} covenants`);
  console.log(`   • ${downstreamConnectors.length} downstream connectors`);
  console.log(`   • ${auditEvents.length} audit events`);
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
