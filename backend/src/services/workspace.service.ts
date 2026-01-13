import { prisma } from '../index.js';
import { Role, MemberStatus, ClauseType, NodeType, VariableType, GoldenRecordStatus } from '@prisma/client';
import { AIParseResult } from '../ai/index.js';

export interface CreateWorkspaceInput {
  name: string;
  currency: string;
  amount: number;
  standard: string;
  basePdfName?: string;
}

export interface CreateWorkspaceResult {
  success: boolean;
  workspace?: {
    id: string;
    name: string;
    currency: string;
    amount: number;
    standard: string;
    basePdfName?: string | null;
    createdAt: string;
    lastSyncAt: string;
    createdById: string;
    governanceRules: any;
  };
  membership?: {
    id: string;
    workspaceId: string;
    userId: string;
    role: string;
    isAdmin: boolean;
    status: string;
    invitedAt: string;
    joinedAt: string | null;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface InviteMemberInput {
  workspaceId: string;
  email: string;
  role: Role;
}

export interface InviteMemberResult {
  success: boolean;
  member?: {
    id: string;
    workspaceId: string;
    userId: string;
    role: string;
    isAdmin: boolean;
    status: string;
    invitedAt: string;
    joinedAt: string | null;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface ChangeRoleInput {
  workspaceId: string;
  memberId: string;
  newRole: Role;
}

export interface ChangeRoleResult {
  success: boolean;
  member?: {
    id: string;
    workspaceId: string;
    userId: string;
    role: string;
    isAdmin: boolean;
    status: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface RemoveMemberResult {
  success: boolean;
  error?: {
    code: string;
    message: string;
  };
}

export interface UpdateGovernanceInput {
  requireReasonForSensitiveEdits?: boolean;
  legalCanRevertDraft?: boolean;
  riskApprovalRequiredForOverride?: boolean;
  publishBlockedWhenHighDrift?: boolean;
  definitionsLockedAfterApproval?: boolean;
  externalCounselReadOnly?: boolean;
}

/**
 * Default governance rules for new workspaces
 */
const defaultGovernanceRules = {
  requireReasonForSensitiveEdits: true,
  legalCanRevertDraft: false,
  riskApprovalRequiredForOverride: false,
  publishBlockedWhenHighDrift: true,
  definitionsLockedAfterApproval: false,
  externalCounselReadOnly: false,
};

/**
 * List all workspaces where the user has active membership
 */
export async function listWorkspacesForUser(userId: string) {
  if (!userId) {
    return [];
  }

  const memberships = await prisma.workspaceMember.findMany({
    where: {
      userId,
      status: MemberStatus.active,
    },
    include: {
      workspace: {
        include: {
          _count: {
            select: {
              members: true,
            },
          },
        },
      },
    },
  });

  return memberships.map((m) => ({
    id: m.workspace.id,
    name: m.workspace.name,
    currency: m.workspace.currency,
    amount: m.workspace.amount,
    standard: m.workspace.standard,
    basePdfName: m.workspace.basePdfName,
    createdAt: m.workspace.createdAt.toISOString(),
    lastSyncAt: m.workspace.lastSyncAt.toISOString(),
    createdById: m.workspace.createdById,
    governanceRules: m.workspace.governanceRules,
    memberCount: m.workspace._count.members,
  }));
}

/**
 * Get a workspace by ID
 */
export async function getWorkspace(workspaceId: string, userId: string) {
  if (!workspaceId) {
    return null;
  }

  // Check user has access
  const membership = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId,
      userId,
      status: MemberStatus.active,
    },
  });

  if (!membership) {
    return null;
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      _count: {
        select: {
          members: true,
          clauses: true,
          driftItems: true,
        },
      },
    },
  });

  if (!workspace) {
    return null;
  }

  return {
    id: workspace.id,
    name: workspace.name,
    currency: workspace.currency,
    amount: workspace.amount,
    standard: workspace.standard,
    basePdfName: workspace.basePdfName,
    createdAt: workspace.createdAt.toISOString(),
    lastSyncAt: workspace.lastSyncAt.toISOString(),
    createdById: workspace.createdById,
    governanceRules: workspace.governanceRules,
    memberCount: workspace._count.members,
    clauseCount: workspace._count.clauses,
    driftCount: workspace._count.driftItems,
  };
}

/**
 * Create a new workspace
 */
export async function createWorkspace(
  input: CreateWorkspaceInput,
  creatorUserId: string,
  aiParsedData?: AIParseResult
): Promise<CreateWorkspaceResult> {
  // Validate inputs
  if (!input.name || !input.name.trim()) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Workspace name is required',
      },
    };
  }

  if (!input.currency || !input.currency.trim()) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Currency is required',
      },
    };
  }

  if (input.amount === undefined || input.amount <= 0) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Amount must be a positive number',
      },
    };
  }

  if (!input.standard || !input.standard.trim()) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Standard is required',
      },
    };
  }

  try {
    // Create workspace and membership in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the workspace
      const workspace = await tx.workspace.create({
        data: {
          name: input.name.trim(),
          currency: input.currency.trim().toUpperCase(),
          amount: input.amount,
          standard: input.standard.trim(),
          basePdfName: input.basePdfName?.trim() || null,
          createdById: creatorUserId,
          governanceRules: defaultGovernanceRules,
        },
      });

      // Create membership for creator (Agent with admin privileges)
      const membership = await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: creatorUserId,
          role: Role.agent,
          isAdmin: true,
          status: MemberStatus.active,
          joinedAt: new Date(),
        },
      });

      // Create audit event
      const user = await tx.user.findUnique({ where: { id: creatorUserId } });
      await tx.auditEvent.create({
        data: {
          workspaceId: workspace.id,
          actorId: creatorUserId,
          actorName: user?.name || 'Unknown',
          eventType: 'WORKSPACE_CREATE',
          targetType: 'workspace',
          targetId: workspace.id,
          afterState: JSON.stringify({
            name: workspace.name,
            currency: workspace.currency,
            amount: workspace.amount,
          }),
        },
      });

      // If AI parsed data provided, create clauses, graph nodes/edges/state, golden record
      if (aiParsedData) {
        // Create clauses and collect their IDs
        const clauseIdMap: Record<number, string> = {};
        for (let i = 0; i < aiParsedData.clauses.length; i++) {
          const clause = aiParsedData.clauses[i];
          const created = await tx.clause.create({
            data: {
              workspaceId: workspace.id,
              title: clause.title,
              body: clause.body,
              type: clause.type as ClauseType,
              order: clause.order,
              isSensitive: clause.isSensitive,
              lastModifiedBy: creatorUserId,
            },
          });
          clauseIdMap[i] = created.id;
        }

        // Create variables and collect their IDs
        const variableIdMap: Record<number, string> = {};
        if (aiParsedData.variables) {
          for (let i = 0; i < aiParsedData.variables.length; i++) {
            const variable = aiParsedData.variables[i];
            const clauseId = clauseIdMap[variable.clauseIndex];
            if (clauseId) {
              const created = await tx.variable.create({
                data: {
                  workspaceId: workspace.id,
                  clauseId,
                  label: variable.label,
                  type: variable.type as VariableType,
                  value: variable.value,
                  unit: variable.unit || null,
                  baselineValue: variable.baselineValue || variable.value, // Set baseline to value initially
                  lastModifiedBy: creatorUserId,
                },
              });
              variableIdMap[i] = created.id;
            }
          }
        }

        // Create covenants
        if (aiParsedData.covenants) {
          for (const covenant of aiParsedData.covenants) {
            const clauseId = clauseIdMap[covenant.clauseIndex];
            if (clauseId) {
              await tx.covenant.create({
                data: {
                  workspaceId: workspace.id,
                  clauseId,
                  name: covenant.name,
                  testFrequency: covenant.testFrequency,
                  threshold: covenant.threshold,
                  calculationBasis: covenant.calculationBasis,
                },
              });
            }
          }
        }

        // Create graph nodes and collect their IDs
        const nodeIdMap: Record<number, string> = {};
        for (let i = 0; i < aiParsedData.graphNodes.length; i++) {
          const node = aiParsedData.graphNodes[i];
          const created = await tx.graphNode.create({
            data: {
              workspaceId: workspace.id,
              label: node.label,
              type: node.type as NodeType,
              clauseId: clauseIdMap[node.clauseIndex] || null,
              variableId: node.variableIndex !== undefined ? variableIdMap[node.variableIndex] || null : null,
              value: node.value || null,
              hasDrift: node.hasDrift,
              hasWarning: node.hasWarning,
            },
          });
          nodeIdMap[i] = created.id;
        }

        // Create graph edges
        for (const edge of aiParsedData.graphEdges) {
          const sourceId = nodeIdMap[edge.sourceNodeIndex];
          const targetId = nodeIdMap[edge.targetNodeIndex];
          if (sourceId && targetId) {
            await tx.graphEdge.create({
              data: {
                workspaceId: workspace.id,
                sourceId,
                targetId,
                weight: edge.weight,
              },
            });
          }
        }

        // Create graph state
        await tx.graphState.create({
          data: {
            workspaceId: workspace.id,
            integrityScore: aiParsedData.integrityScore,
            lastComputedAt: new Date(),
          },
        });

        // Create golden record
        await tx.goldenRecord.create({
          data: {
            workspaceId: workspace.id,
            status: GoldenRecordStatus.IN_REVIEW,
            integrityScore: aiParsedData.integrityScore,
            unresolvedHighDriftCount: 0,
            schemaJson: JSON.stringify({
              workspaceName: workspace.name,
              clauseCount: aiParsedData.clauses.length,
              variableCount: aiParsedData.variables?.length || 0,
              covenantCount: aiParsedData.covenants?.length || 0,
              nodeCount: aiParsedData.graphNodes.length,
              edgeCount: aiParsedData.graphEdges.length,
              covenants: aiParsedData.covenants || [],
            }),
          },
        });
      }

      return { workspace, membership };
    });

    return {
      success: true,
      workspace: {
        id: result.workspace.id,
        name: result.workspace.name,
        currency: result.workspace.currency,
        amount: result.workspace.amount,
        standard: result.workspace.standard,
        basePdfName: result.workspace.basePdfName,
        createdAt: result.workspace.createdAt.toISOString(),
        lastSyncAt: result.workspace.lastSyncAt.toISOString(),
        createdById: result.workspace.createdById,
        governanceRules: result.workspace.governanceRules,
      },
      membership: {
        id: result.membership.id,
        workspaceId: result.membership.workspaceId,
        userId: result.membership.userId,
        role: result.membership.role,
        isAdmin: result.membership.isAdmin,
        status: result.membership.status,
        invitedAt: result.membership.invitedAt.toISOString(),
        joinedAt: result.membership.joinedAt?.toISOString() || null,
      },
    };
  } catch (error: any) {
    console.error('Error creating workspace:', error);
    return {
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to create workspace',
      },
    };
  }
}

/**
 * Get workspace members
 */
export async function getWorkspaceMembers(workspaceId: string, userId: string) {
  // Check user has access
  const membership = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId,
      userId,
      status: MemberStatus.active,
    },
  });

  if (!membership) {
    return null;
  }

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: [{ isAdmin: 'desc' }, { invitedAt: 'asc' }],
  });

  return members.map((m) => ({
    id: m.id,
    workspaceId: m.workspaceId,
    userId: m.userId,
    role: m.role,
    isAdmin: m.isAdmin,
    status: m.status,
    invitedAt: m.invitedAt.toISOString(),
    joinedAt: m.joinedAt?.toISOString() || null,
    user: m.user,
  }));
}

/**
 * Invite member to workspace
 */
export async function inviteMember(
  input: InviteMemberInput,
  inviterId: string
): Promise<InviteMemberResult> {
  // Validate inputs
  if (!input.email || !input.email.trim()) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Email is required',
      },
    };
  }

  if (!input.role) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Role is required',
      },
    };
  }

  try {
    // Check inviter has permission
    const inviterMembership = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: input.workspaceId,
        userId: inviterId,
        status: MemberStatus.active,
      },
    });

    if (!inviterMembership || !inviterMembership.isAdmin) {
      return {
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Only admins can invite members',
        },
      };
    }

    // Find user by email
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: input.email.toLowerCase().trim(),
          mode: 'insensitive',
        },
      },
    });

    if (!user) {
      return {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User with this email does not exist',
        },
      };
    }

    // Check if already a member
    const existingMembership = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: input.workspaceId,
        userId: user.id,
      },
    });

    if (existingMembership) {
      return {
        success: false,
        error: {
          code: 'ALREADY_MEMBER',
          message: 'User is already a member of this workspace',
        },
      };
    }

    // Create membership
    const membership = await prisma.workspaceMember.create({
      data: {
        workspaceId: input.workspaceId,
        userId: user.id,
        role: input.role,
        isAdmin: false,
        status: MemberStatus.pending,
      },
    });

    // Create audit event
    const inviter = await prisma.user.findUnique({ where: { id: inviterId } });
    await prisma.auditEvent.create({
      data: {
        workspaceId: input.workspaceId,
        actorId: inviterId,
        actorName: inviter?.name || 'Unknown',
        eventType: 'INVITE_SENT',
        targetType: 'user',
        targetId: user.id,
        afterState: JSON.stringify({
          email: user.email,
          role: input.role,
        }),
      },
    });

    return {
      success: true,
      member: {
        id: membership.id,
        workspaceId: membership.workspaceId,
        userId: membership.userId,
        role: membership.role,
        isAdmin: membership.isAdmin,
        status: membership.status,
        invitedAt: membership.invitedAt.toISOString(),
        joinedAt: membership.joinedAt?.toISOString() || null,
      },
    };
  } catch (error: any) {
    console.error('Error inviting member:', error);
    return {
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to invite member',
      },
    };
  }
}

/**
 * Change member role
 */
export async function changeMemberRole(
  input: ChangeRoleInput,
  actorId: string
): Promise<ChangeRoleResult> {
  try {
    // Check actor has permission
    const actorMembership = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: input.workspaceId,
        userId: actorId,
        status: MemberStatus.active,
      },
    });

    if (!actorMembership || !actorMembership.isAdmin) {
      return {
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Only admins can change roles',
        },
      };
    }

    // Get the member
    const member = await prisma.workspaceMember.findUnique({
      where: { id: input.memberId },
    });

    if (!member || member.workspaceId !== input.workspaceId) {
      return {
        success: false,
        error: {
          code: 'MEMBER_NOT_FOUND',
          message: 'Member not found',
        },
      };
    }

    // Update role
    const updated = await prisma.workspaceMember.update({
      where: { id: input.memberId },
      data: { role: input.newRole },
    });

    // Create audit event
    const actor = await prisma.user.findUnique({ where: { id: actorId } });
    await prisma.auditEvent.create({
      data: {
        workspaceId: input.workspaceId,
        actorId,
        actorName: actor?.name || 'Unknown',
        eventType: 'ROLE_CHANGED',
        targetType: 'member',
        targetId: input.memberId,
        beforeState: JSON.stringify({ role: member.role }),
        afterState: JSON.stringify({ role: input.newRole }),
      },
    });

    return {
      success: true,
      member: {
        id: updated.id,
        workspaceId: updated.workspaceId,
        userId: updated.userId,
        role: updated.role,
        isAdmin: updated.isAdmin,
        status: updated.status,
      },
    };
  } catch (error: any) {
    console.error('Error changing role:', error);
    return {
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to change role',
      },
    };
  }
}

/**
 * Remove member from workspace
 */
export async function removeMember(
  workspaceId: string,
  memberId: string,
  actorId: string
): Promise<RemoveMemberResult> {
  try {
    // Check actor has permission
    const actorMembership = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: actorId,
        status: MemberStatus.active,
      },
    });

    if (!actorMembership || !actorMembership.isAdmin) {
      return {
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Only admins can remove members',
        },
      };
    }

    // Get the member
    const member = await prisma.workspaceMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.workspaceId !== workspaceId) {
      return {
        success: false,
        error: {
          code: 'MEMBER_NOT_FOUND',
          message: 'Member not found',
        },
      };
    }

    // Can't remove yourself if you're the last admin
    if (member.userId === actorId && member.isAdmin) {
      const adminCount = await prisma.workspaceMember.count({
        where: {
          workspaceId,
          isAdmin: true,
          status: MemberStatus.active,
        },
      });

      if (adminCount <= 1) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Cannot remove the last admin',
          },
        };
      }
    }

    // Update status to removed
    await prisma.workspaceMember.update({
      where: { id: memberId },
      data: { status: MemberStatus.removed },
    });

    // Create audit event
    const actor = await prisma.user.findUnique({ where: { id: actorId } });
    await prisma.auditEvent.create({
      data: {
        workspaceId,
        actorId,
        actorName: actor?.name || 'Unknown',
        eventType: 'MEMBER_REMOVED',
        targetType: 'member',
        targetId: memberId,
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error removing member:', error);
    return {
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to remove member',
      },
    };
  }
}

/**
 * Update governance rules
 */
export async function updateGovernanceRules(
  workspaceId: string,
  rules: UpdateGovernanceInput,
  userId: string
) {
  try {
    // Check user has permission
    const membership = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId,
        status: MemberStatus.active,
      },
    });

    if (!membership || !membership.isAdmin) {
      return {
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Only admins can update governance rules',
        },
      };
    }

    // Get current workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      return {
        success: false,
        error: {
          code: 'WORKSPACE_NOT_FOUND',
          message: 'Workspace not found',
        },
      };
    }

    // Merge with existing rules
    const currentRules = workspace.governanceRules as any;
    const newRules = { ...currentRules, ...rules };

    // Update workspace
    const updated = await prisma.workspace.update({
      where: { id: workspaceId },
      data: { governanceRules: newRules },
    });

    // Create audit event
    const user = await prisma.user.findUnique({ where: { id: userId } });
    await prisma.auditEvent.create({
      data: {
        workspaceId,
        actorId: userId,
        actorName: user?.name || 'Unknown',
        eventType: 'GOVERNANCE_UPDATED',
        targetType: 'workspace',
        targetId: workspaceId,
        beforeState: JSON.stringify(currentRules),
        afterState: JSON.stringify(newRules),
      },
    });

    return {
      success: true,
      workspace: {
        id: updated.id,
        governanceRules: updated.governanceRules,
      },
    };
  } catch (error: any) {
    console.error('Error updating governance:', error);
    return {
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to update governance rules',
      },
    };
  }
}
