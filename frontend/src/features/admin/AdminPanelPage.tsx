/**
 * Admin Panel Page
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 10.10, 10.11
 */

import React, { useState, useEffect, useCallback } from 'react';
import { clsx } from 'clsx';
import { usePermission } from '../../stores/PermissionProvider';
import { useWorkspace } from '../../stores/WorkspaceProvider';
import { useAuth } from '../../stores/AuthProvider';
import { useToastHelpers } from '../../components/feedback/ToastContainer';
import { Button, Badge, Table, Input, Select, Toggle } from '../../components/ui';
import Modal from '../../components/feedback/Modal';
import ConfirmDangerModal from '../../components/feedback/ConfirmDangerModal';
import { WorkspaceMember, User, Role } from '../../types/user';
import { GovernanceRules } from '../../types/workspace';
import { listMembers, inviteMember, changeRole, removeMember, updateGovernanceRules } from '../../services/workspaceService';

// Access Denied Component for non-admin users
const AccessDeniedPage: React.FC = () => {
  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
      <div className="text-center max-w-md mx-auto">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
          <svg 
            className="w-8 h-8 text-red-500" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
            />
          </svg>
        </div>
        
        <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Access Denied
        </h1>
        
        <p className="text-slate-500 dark:text-slate-400 mb-6">
          You don't have permission to access the Admin Panel. Only workspace administrators can manage members and governance settings.
        </p>
        
        <Button
          variant="primary"
          onClick={() => window.history.back()}
          className="h-10 px-6 rounded-xl font-bold text-xs shadow-lg shadow-primary-500/20"
        >
          Go Back
        </Button>
      </div>
    </div>
  );
};

// Change Role Modal Component
interface ChangeRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  member: MemberWithUser | null;
}

const ChangeRoleModal: React.FC<ChangeRoleModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  member,
}) => {
  const { activeWorkspace } = useWorkspace();
  const { user: currentUser } = useAuth();
  const { success, error: showError } = useToastHelpers();
  const [newRole, setNewRole] = useState<Role>('legal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens/closes or member changes
  useEffect(() => {
    if (isOpen && member) {
      setNewRole(member.member.role);
      setError(null);
    }
  }, [isOpen, member]);

  const roleOptions = [
    { value: 'agent', label: 'Agent/Lead Arranger' },
    { value: 'legal', label: 'Legal Counsel' },
    { value: 'risk', label: 'Risk/Credit' },
    { value: 'investor', label: 'Investor/LP' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!activeWorkspace?.id || !currentUser?.id || !member) {
      setError('Missing required information');
      return;
    }

    if (newRole === member.member.role) {
      setError('Please select a different role');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await changeRole(
        {
          workspaceId: activeWorkspace.id,
          memberId: member.member.id,
          newRole,
        },
        currentUser.id
      );

      if (result.success) {
        success('Role changed successfully', `${member.user.name} is now ${roleOptions.find(r => r.value === newRole)?.label}`);
        onSuccess();
        onClose();
      } else {
        showError('Failed to change role', result.error?.message || 'An unexpected error occurred');
        setError(result.error?.message || 'Failed to change role');
      }
    } catch (err) {
      showError('Failed to change role', 'An unexpected error occurred');
      setError('An unexpected error occurred');
      console.error('Change role error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!member) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Change Member Role"
      showCancel={true}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 border border-red-200 rounded-xl bg-red-50 dark:bg-red-900/20 dark:border-red-800">
            <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
            Member
          </label>
          <div className="flex items-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                {member.user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="ml-3">
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {member.user.name}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {member.user.email}
              </div>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="newRole" className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
            New Role
          </label>
          <Select
            id="newRole"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as Role)}
            disabled={isSubmitting}
            required
            options={roleOptions}
            className="rounded-xl"
          />
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            This action will be logged in the audit trail.
          </p>
        </div>

        <div className="flex justify-end pt-4 space-x-3 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-10 px-5 rounded-xl font-bold text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            disabled={isSubmitting || newRole === member.member.role}
            className="h-10 px-5 rounded-xl font-bold text-xs shadow-lg shadow-primary-500/20"
          >
            Change Role
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Invite Member Modal Component
interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { activeWorkspace } = useWorkspace();
  const { user: currentUser } = useAuth();
  const { success, error: showError } = useToastHelpers();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('legal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setRole('legal');
      setError(null);
    }
  }, [isOpen]);

  const roleOptions = [
    { value: 'agent', label: 'Agent/Lead Arranger' },
    { value: 'legal', label: 'Legal Counsel' },
    { value: 'risk', label: 'Risk/Credit' },
    { value: 'investor', label: 'Investor/LP' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!activeWorkspace?.id || !currentUser?.id) {
      setError('Missing workspace or user information');
      return;
    }

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!role) {
      setError('Role is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await inviteMember(
        {
          workspaceId: activeWorkspace.id,
          email: email.trim(),
          role,
        },
        currentUser.id
      );

      if (result.success) {
        success('Member invited successfully', `Invitation sent to ${email.trim()}`);
        onSuccess();
        onClose();
      } else {
        showError('Failed to invite member', result.error?.message || 'An unexpected error occurred');
        setError(result.error?.message || 'Failed to invite member');
      }
    } catch (err) {
      showError('Failed to invite member', 'An unexpected error occurred');
      setError('An unexpected error occurred');
      console.error('Invite member error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Invite Member"
      showCancel={true}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 border border-red-200 rounded-xl bg-red-50 dark:bg-red-900/20 dark:border-red-800">
            <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
            Email Address
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email address"
            disabled={isSubmitting}
            required
            className="rounded-xl"
          />
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            The user must already have an account in the system.
          </p>
        </div>

        <div>
          <label htmlFor="role" className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
            Role
          </label>
          <Select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            disabled={isSubmitting}
            required
            options={roleOptions}
            className="rounded-xl"
          />
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Select the appropriate role for this team member.
          </p>
        </div>

        <div className="flex justify-end pt-4 space-x-3 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-10 px-5 rounded-xl font-bold text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            disabled={isSubmitting}
            className="h-10 px-5 rounded-xl font-bold text-xs shadow-lg shadow-primary-500/20"
          >
            Send Invite
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Member with user info for display
interface MemberWithUser {
  member: WorkspaceMember;
  user: User;
}

// Members Tab Component
const MembersTab: React.FC = () => {
  const { activeWorkspace } = useWorkspace();
  const { user: currentUser } = useAuth();
  const { can } = usePermission();
  const { success, error: showError } = useToastHelpers();
  const [members, setMembers] = useState<MemberWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showChangeRoleModal, setShowChangeRoleModal] = useState(false);
  const [showRemoveMemberModal, setShowRemoveMemberModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberWithUser | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // Load members on mount and when workspace changes
  const loadMembers = useCallback(async () => {
    if (!activeWorkspace?.id) return;

    setLoading(true);
    try {
      const memberList = await listMembers(activeWorkspace.id);
      
      // User details are now included in the API response
      const membersWithUsers: MemberWithUser[] = memberList.map(member => {
        // Use user data from API response, fallback if not present
        const user = member.user ? {
          id: member.user.id,
          email: member.user.email,
          name: member.user.name,
          createdAt: new Date().toISOString(),
        } : {
          id: member.userId,
          email: 'unknown@example.com',
          name: 'Unknown User',
          createdAt: new Date().toISOString(),
        };
        return { member, user };
      });
      
      setMembers(membersWithUsers);
    } catch (error) {
      console.error('Failed to load members:', error);
      showError('Failed to load members', 'Please refresh the page to try again');
    } finally {
      setLoading(false);
    }
  }, [activeWorkspace?.id, showError]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleInviteSuccess = () => {
    loadMembers(); // Reload members list
  };

  const handleChangeRoleSuccess = () => {
    setSelectedMember(null);
    loadMembers(); // Reload members list
  };

  const handleChangeRoleClick = (memberWithUser: MemberWithUser) => {
    setSelectedMember(memberWithUser);
    setShowChangeRoleModal(true);
  };

  const handleRemoveMemberClick = (memberWithUser: MemberWithUser) => {
    setSelectedMember(memberWithUser);
    setShowRemoveMemberModal(true);
  };

  const handleRemoveMember = async () => {
    if (!activeWorkspace?.id || !currentUser?.id || !selectedMember) {
      showError('Failed to remove member', 'Missing required information');
      return;
    }

    setIsRemoving(true);

    try {
      const result = await removeMember(
        activeWorkspace.id,
        selectedMember.member.id,
        currentUser.id
      );

      if (result.success) {
        success('Member removed successfully', `${selectedMember.user.name} has been removed from the workspace`);
        setSelectedMember(null);
        setShowRemoveMemberModal(false);
        loadMembers(); // Reload members list
      } else {
        showError('Failed to remove member', result.error?.message || 'An unexpected error occurred');
      }
    } catch (err) {
      showError('Failed to remove member', 'An unexpected error occurred');
      console.error('Remove member error:', err);
    } finally {
      setIsRemoving(false);
    }
  };

  const formatRole = (role: Role): string => {
    switch (role) {
      case 'agent':
        return 'Agent/Lead Arranger';
      case 'legal':
        return 'Legal Counsel';
      case 'risk':
        return 'Risk/Credit';
      case 'investor':
        return 'Investor/LP';
      default:
        return role;
    }
  };

  const formatStatus = (status: string): string => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'pending':
        return 'Pending';
      case 'removed':
        return 'Removed';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300';
      case 'pending':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300';
      case 'removed':
        return 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  // Table columns for members
  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role' },
    { key: 'status', header: 'Status' },
    { key: 'joinedAt', header: 'Joined' },
    { key: 'actions', header: 'Actions', className: 'text-right' },
  ];

  // Transform members data for table
  const tableData = members.map(({ member, user }) => ({
    id: member.id,
    name: (
      <div className="flex items-center">
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
          <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
            {user.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="ml-3">
          <div className="text-sm font-bold text-slate-900 dark:text-white">
            {user.name}
            {member.isAdmin && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                Admin
              </span>
            )}
          </div>
        </div>
      </div>
    ),
    email: <span className="text-sm text-slate-600 dark:text-slate-400">{user.email}</span>,
    role: <Badge variant="role" value={formatRole(member.role)} />,
    status: (
      <span className={clsx(
        'px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider',
        getStatusColor(member.status)
      )}>
        {formatStatus(member.status)}
      </span>
    ),
    joinedAt: <span className="text-sm text-slate-600 dark:text-slate-400">{formatDate(member.joinedAt)}</span>,
    actions: (
      <div className="flex justify-end space-x-2">
        {can('workspace:changeRole') && member.status === 'active' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleChangeRoleClick({ member, user })}
            className="h-8 px-3 rounded-lg font-bold text-xs"
          >
            Change Role
          </Button>
        )}
        {can('workspace:removeMember') && member.status !== 'removed' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleRemoveMemberClick({ member, user })}
            className="h-8 px-3 rounded-lg font-bold text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            Remove
          </Button>
        )}
      </div>
    ),
    memberData: { member, user }, // Store original data for actions
  }));

  const emptyState = (
    <div className="py-12 text-center">
      <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
        <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
        No members
      </h3>
      <p className="text-slate-500 dark:text-slate-400">
        Get started by inviting team members to this workspace.
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header with Invite Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Workspace Members
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage team members and their roles in this workspace.
          </p>
        </div>
        {can('workspace:invite') && (
          <Button
            variant="primary"
            onClick={() => setShowInviteModal(true)}
            className="h-10 px-5 rounded-xl font-bold text-xs shadow-lg shadow-primary-500/20"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Invite Member
          </Button>
        )}
      </div>

      {/* Members Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <Table
          columns={columns}
          data={tableData}
          loading={loading}
          emptyState={emptyState}
        />
      </div>

      {/* Invite Member Modal */}
      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={handleInviteSuccess}
      />

      {/* Change Role Modal */}
      <ChangeRoleModal
        isOpen={showChangeRoleModal}
        onClose={() => {
          setShowChangeRoleModal(false);
          setSelectedMember(null);
        }}
        onSuccess={handleChangeRoleSuccess}
        member={selectedMember}
      />

      {/* Remove Member Modal */}
      <ConfirmDangerModal
        isOpen={showRemoveMemberModal}
        title="Remove Member"
        message={
          selectedMember
            ? `Are you sure you want to remove ${selectedMember.user.name} from this workspace? This action cannot be undone.`
            : 'Are you sure you want to remove this member?'
        }
        confirmText="Remove Member"
        warningText="This will revoke all access to the workspace immediately."
        onConfirm={handleRemoveMember}
        onCancel={() => {
          setShowRemoveMemberModal(false);
          setSelectedMember(null);
        }}
        isProcessing={isRemoving}
      />
    </div>
  );
};

// Governance Rules Tab Component
const GovernanceRulesTab: React.FC = () => {
  const { activeWorkspace, selectWorkspace } = useWorkspace();
  const { user: currentUser } = useAuth();
  const { success, error: showError } = useToastHelpers();
  const [rules, setRules] = useState<GovernanceRules | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Initialize rules from workspace
  useEffect(() => {
    if (activeWorkspace?.governanceRules) {
      setRules({ ...activeWorkspace.governanceRules });
    }
  }, [activeWorkspace?.governanceRules]);

  const handleRuleChange = (ruleKey: keyof GovernanceRules, value: boolean) => {
    if (rules) {
      setRules({
        ...rules,
        [ruleKey]: value,
      });
    }
  };

  const handleSaveRules = async () => {
    if (!activeWorkspace?.id || !currentUser?.id || !rules) {
      showError('Failed to update governance rules', 'Missing required information');
      return;
    }

    setIsUpdating(true);

    try {
      const result = await updateGovernanceRules(
        activeWorkspace.id,
        rules
      );

      if (result.success) {
        success('Governance rules updated successfully', 'Changes have been applied to the workspace');
        // Refresh workspace by re-selecting it
        if (activeWorkspace?.id) {
          await selectWorkspace(activeWorkspace.id);
        }
      } else {
        showError('Failed to update governance rules', result.error?.message || 'An unexpected error occurred');
      }
    } catch (err) {
      showError('Failed to update governance rules', 'An unexpected error occurred');
      console.error('Update governance rules error:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const hasChanges = rules && activeWorkspace?.governanceRules && 
    JSON.stringify(rules) !== JSON.stringify(activeWorkspace.governanceRules);

  if (!rules) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
        <p className="text-slate-500 dark:text-slate-400">Loading governance rules...</p>
      </div>
    );
  }

  const governanceRuleConfigs = [
    {
      key: 'requireReasonForSensitiveEdits' as keyof GovernanceRules,
      label: 'Require reason for sensitive edits',
      description: 'Force users to provide a reason when editing Financial, Covenant, or Definition clauses.',
    },
    {
      key: 'legalCanRevertDraft' as keyof GovernanceRules,
      label: 'Legal can revert draft',
      description: 'Allow Legal Counsel role to revert draft changes to baseline values.',
    },
    {
      key: 'riskApprovalRequiredForOverride' as keyof GovernanceRules,
      label: 'Risk approval required for override',
      description: 'Require Risk/Credit approval before baseline override takes effect.',
    },
    {
      key: 'publishBlockedWhenHighDrift' as keyof GovernanceRules,
      label: 'Publish blocked when HIGH drift exists',
      description: 'Prevent Golden Record publishing until all HIGH severity drift is resolved.',
    },
    {
      key: 'definitionsLockedAfterApproval' as keyof GovernanceRules,
      label: 'Definitions locked after approval',
      description: 'Make Definition clauses read-only after approval and log section lock events.',
    },
    {
      key: 'externalCounselReadOnly' as keyof GovernanceRules,
      label: 'External counsel read-only',
      description: 'Restrict external Legal Counsel members to read-only drafting access.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Governance Rules
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure workspace-level governance and compliance policies.
          </p>
        </div>
        {hasChanges && (
          <Button
            variant="primary"
            onClick={handleSaveRules}
            loading={isUpdating}
            disabled={isUpdating}
            className="h-10 px-5 rounded-xl font-bold text-xs shadow-lg shadow-primary-500/20"
          >
            Save Changes
          </Button>
        )}
      </div>

      {/* Rules List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
        {governanceRuleConfigs.map((config) => (
          <div key={config.key} className="p-5">
            <Toggle
              checked={rules[config.key]}
              onChange={(value) => handleRuleChange(config.key, value)}
              disabled={isUpdating}
              label={config.label}
              description={config.description}
            />
          </div>
        ))}
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
        <div className="flex">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-bold text-blue-800 dark:text-blue-200">
              About Governance Rules
            </h3>
            <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
              These rules modify permission behavior and enforce compliance policies across the workspace. 
              Changes are logged in the audit trail and take effect immediately for all users.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Document Controls Tab Component
const DocumentControlsTab: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Document Controls
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage section-level access controls and document locking policies.
        </p>
      </div>

      {/* Coming Soon Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm py-16 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <svg 
            className="w-8 h-8 text-slate-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" 
            />
          </svg>
        </div>
        
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
          Document Controls
        </h3>
        
        <p className="max-w-md mx-auto text-slate-500 dark:text-slate-400 mb-6">
          Section-level locking controls will be available in a future release. 
          This feature will allow administrators to lock specific document sections 
          after approval to prevent unauthorized changes.
        </p>

        <div className="max-w-lg mx-auto bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
          <div className="flex">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-4 text-left">
              <h4 className="text-sm font-bold text-blue-800 dark:text-blue-200">
                Planned Features
              </h4>
              <ul className="mt-2 text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                <li>Lock/unlock individual document sections</li>
                <li>Approval-based section locking</li>
                <li>Granular edit permissions by clause type</li>
                <li>Temporary lock overrides with audit trail</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

type TabType = 'members' | 'governance' | 'documents';

const AdminPanelPage: React.FC = () => {
  const { can } = usePermission();
  const { activeWorkspace } = useWorkspace();
  const [activeTab, setActiveTab] = useState<TabType>('members');
  
  // Check if user has admin permission (Requirements: 10.5)
  const hasAdminAccess = can('workspace:admin');
  
  // Show access denied page for non-admin users
  if (!hasAdminAccess) {
    return <AccessDeniedPage />;
  }

  const tabs = [
    { 
      id: 'members' as TabType, 
      label: 'Members',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    { 
      id: 'governance' as TabType, 
      label: 'Governance Rules',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
    { 
      id: 'documents' as TabType, 
      label: 'Document Controls',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'members':
        return <MembersTab />;
      case 'governance':
        return <GovernanceRulesTab />;
      case 'documents':
        return <DocumentControlsTab />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Admin Panel
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Manage workspace members and governance settings for {activeWorkspace?.name}
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="border-b border-slate-100 dark:border-slate-800 px-5">
            <nav className="-mb-px flex space-x-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    'flex items-center gap-2 whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm transition-colors',
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-5">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanelPage;