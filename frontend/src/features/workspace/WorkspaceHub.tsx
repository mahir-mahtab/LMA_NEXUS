/**
 * Workspace Hub Page
 * Displays workspace list with cards showing deal name, standard, role badge, last sync, and enter button
 * Requirements: 2.1
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../../stores/WorkspaceProvider';
import { useAuth } from '../../stores/AuthProvider';
import { useToastHelpers } from '../../components/feedback/ToastContainer';
import { getUserMembership, CreateWorkspaceInput } from '../../services/workspaceService';
import { WorkspaceMember } from '../../types/user';
import { Workspace } from '../../types/workspace';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import Input from '../../components/ui/Input';
import Modal from '../../components/feedback/Modal';
import Select from '../../components/ui/Select';
import { logout } from '../../services/authService';
import { WorkspaceCreationLoader } from '../../components/workspaces/WorkspaceCreationLoader';
import { clsx } from 'clsx';

interface WorkspaceCardProps {
  workspace: Workspace;
  membership: WorkspaceMember;
  onEnter: (workspaceId: string) => void;
}

const WorkspaceCard: React.FC<WorkspaceCardProps> = ({ workspace, membership, onEnter }) => {
  const formatLastSync = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'agent': return 'Agent/Lead Arranger';
      case 'legal': return 'Legal Counsel';
      case 'risk': return 'Risk/Credit';
      case 'investor': return 'Investor/LP';
      default: return role;
    }
  };

  return (
    <Card 
      hover 
      className="group h-full border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
      padding="none"
    >
      <div className="flex flex-col h-full">
        {/* Top Accent Line */}
        <div className="h-1.5 w-full bg-primary-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        
        <div className="p-6 flex-1">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-3">
                <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                  <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <Badge variant="role" value={getRoleDisplayName(membership.role)} className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-none font-medium" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate group-hover:text-primary-600 transition-colors" title={workspace.name}>
                {workspace.name}
              </h3>
              <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                {formatAmount(workspace.amount, workspace.currency)}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Standard</p>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{workspace.standard}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Last synced</p>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{formatLastSync(workspace.lastSyncAt)}</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 bg-slate-50 dark:bg-slate-900/50">
          <Button 
            variant="primary" 
            size="lg" 
            className="w-full justify-center bg-primary-600 hover:bg-primary-700 text-white border-none rounded-xl shadow-lg shadow-primary-500/20 transform transition-all active:scale-[0.98]"
            onClick={() => onEnter(workspace.id)}
          >
            Enter Workspace
            <svg className="ml-2 w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Button>
        </div>
      </div>
    </Card>
  );
};

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (workspace: Workspace) => void;
}

const CreateWorkspaceModal: React.FC<CreateWorkspaceModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const navigate = useNavigate();
  const { createWorkspace } = useWorkspace();
  const { success, error: showError } = useToastHelpers();
  const [formData, setFormData] = useState<CreateWorkspaceInput>({
    name: '',
    currency: 'USD',
    amount: 0,
    standard: '',
    basePdfName: undefined,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Creation loader state (separate from isSubmitting to not conflict with other loading states)
  const [showCreationLoader, setShowCreationLoader] = useState(false);
  const [isApiComplete, setIsApiComplete] = useState(false);
  const [isApiSuccess, setIsApiSuccess] = useState(false);
  const [apiErrorMessage, setApiErrorMessage] = useState<string | undefined>(undefined);
  const [createdWorkspace, setCreatedWorkspace] = useState<Workspace | null>(null);
  
  // Track the workspace name for the loader
  const workspaceNameRef = useRef<string>('');

  const currencyOptions = [
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'JPY', label: 'JPY - Japanese Yen' },
    { value: 'CAD', label: 'CAD - Canadian Dollar' },
    { value: 'AUD', label: 'AUD - Australian Dollar' },
  ];

  const standardOptions = [
    { value: 'LMA-style v2024.1', label: 'LMA-style v2024.1' },
    { value: 'LMA-style v2025.0', label: 'LMA-style v2025.0' },
    { value: 'LSTA Standard', label: 'LSTA Standard' },
    { value: 'Custom Template', label: 'Custom Template' },
  ];

  const resetForm = () => {
    setFormData({
      name: '',
      currency: 'USD',
      amount: 0,
      standard: '',
      basePdfName: undefined,
    });
    setErrors({});
    setSelectedFile(null);
    setIsSubmitting(false);
    // Reset loader state
    setShowCreationLoader(false);
    setIsApiComplete(false);
    setIsApiSuccess(false);
    setApiErrorMessage(undefined);
    setCreatedWorkspace(null);
    workspaceNameRef.current = '';
  };

  const handleCreationComplete = () => {
    if (isApiSuccess && createdWorkspace) {
      // Navigate to the new workspace
      success('Workspace created successfully', `${createdWorkspace.name} is ready to use`);
      onSuccess(createdWorkspace);
      resetForm();
      onClose();
      navigate(`/app/workspaces/${createdWorkspace.id}/dashboard`);
    } else {
      // Just close the loader, keep the modal open with error
      setShowCreationLoader(false);
      setIsApiComplete(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Workspace name is required';
    }

    if (!formData.currency) {
      newErrors.currency = 'Currency is required';
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.standard) {
      newErrors.standard = 'Standard is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // Store workspace name for loader display
    workspaceNameRef.current = formData.name;
    
    // Start the cinematic loader
    setShowCreationLoader(true);
    setIsApiComplete(false);
    setIsApiSuccess(false);
    setApiErrorMessage(undefined);
    setIsSubmitting(true);

    try {
      const submitData = {
        ...formData,
        basePdfName: selectedFile?.name,
        document: selectedFile || undefined, // Include the file for PDF extraction
      };

      const result = await createWorkspace(submitData);
      
      if (result.success && result.workspace) {
        // Store the created workspace and signal success to loader
        setCreatedWorkspace(result.workspace);
        setIsApiSuccess(true);
        setIsApiComplete(true);
        // Don't close modal here - let the loader handle the transition
      } else {
        // Signal error to loader
        setIsApiSuccess(false);
        setApiErrorMessage(result.error || 'Failed to create workspace');
        setIsApiComplete(true);
        showError('Failed to create workspace', result.error || 'An unexpected error occurred');
        setErrors({ submit: result.error || 'Failed to create workspace' });
      }
    } catch (error) {
      setIsApiSuccess(false);
      setApiErrorMessage('An unexpected error occurred');
      setIsApiComplete(true);
      showError('Failed to create workspace', 'An unexpected error occurred');
      setErrors({ submit: 'An unexpected error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setErrors({ file: 'Please select a PDF or DOCX file' });
        return;
      }
      
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setErrors({ file: 'File size must be less than 10MB' });
        return;
      }

      setSelectedFile(file);
      setErrors({ ...errors, file: '' });
    }
  };

  const formatAmount = (value: string) => {
    // Remove non-numeric characters except decimal point
    const numericValue = value.replace(/[^\d.]/g, '');
    
    // Parse as number and format
    const number = parseFloat(numericValue);
    if (isNaN(number)) return '';
    
    return number.toLocaleString('en-US');
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = value.replace(/[^\d.]/g, '');
    const number = parseFloat(numericValue);
    
    setFormData({
      ...formData,
      amount: isNaN(number) ? 0 : number,
    });
  };

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Workspace"
      showCancel={false}
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <Input
              label="Workspace Name"
              placeholder="e.g., Project Alpha Syndicated Loan"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={errors.name}
              required
              className="h-12 text-base"
            />
          </div>

          <Select
            label="Currency"
            options={currencyOptions}
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            error={errors.currency}
            required
            className="h-12 text-base"
          />

          <Input
            label="Amount"
            placeholder="1,000,000"
            value={formatAmount(formData.amount.toString())}
            onChange={handleAmountChange}
            error={errors.amount}
            required
            className="h-12 text-base"
          />

          <div className="md:col-span-2">
            <Select
              label="Documentation Standard"
              placeholder="Select a standard"
              options={standardOptions}
              value={formData.standard}
              onChange={(e) => setFormData({ ...formData, standard: e.target.value })}
              error={errors.standard}
              required
              className="h-12 text-base"
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Base Document (Optional)
            </label>
            <div className="flex justify-center px-6 pt-10 pb-10 border-2 border-slate-200 border-dashed rounded-2xl hover:bg-slate-50 hover:border-primary-400 transition-all cursor-pointer dark:border-slate-700 dark:hover:bg-slate-800/50 dark:hover:border-primary-500 group relative">
              <div className="space-y-3 text-center">
                <div className="w-14 h-14 mx-auto bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-colors">
                  <svg
                    className="w-7 h-7 text-slate-400 group-hover:text-primary-600 transition-colors"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="flex text-sm text-slate-600 dark:text-slate-400 justify-center">
                  <label
                    htmlFor="file-upload"
                    className="relative font-bold text-primary-600 hover:text-primary-500 cursor-pointer focus-within:outline-none"
                  >
                    <span>Upload a file</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      accept=".pdf,.docx"
                      onChange={handleFileChange}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-slate-400">
                  PDF or DOCX up to 10MB
                </p>
                {selectedFile && (
                  <div className="mt-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-100 dark:border-primary-900/30 inline-flex items-center">
                    <svg className="w-5 h-5 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-semibold text-primary-700 dark:text-primary-300">
                      {selectedFile.name}
                    </span>
                  </div>
                )}
              </div>
            </div>
            {errors.file && (
              <p className="text-sm text-danger-600 dark:text-danger-400">
                {errors.file}
              </p>
            )}
          </div>
        </div>

        {errors.submit && (
          <div className="p-4 border rounded-xl bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800">
            <p className="text-sm font-medium text-danger-700 dark:text-danger-300">
              {errors.submit}
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-8 h-12 rounded-xl"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            disabled={isSubmitting}
            className="px-10 h-12 bg-primary-600 hover:bg-primary-700 text-white border-none rounded-xl shadow-lg shadow-primary-500/20 font-bold"
          >
            Create Workspace
          </Button>
        </div>
      </form>

      {/* Cinematic Creation Loader */}
      <WorkspaceCreationLoader
        isVisible={showCreationLoader}
        workspaceName={workspaceNameRef.current}
        isApiComplete={isApiComplete}
        isSuccess={isApiSuccess}
        onComplete={handleCreationComplete}
        errorMessage={apiErrorMessage}
      />
    </Modal>
  );
};

const WorkspaceHub: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { workspaces, isLoading, selectWorkspace } = useWorkspace();
  const { error: showError } = useToastHelpers();
  const [memberships, setMemberships] = useState<Record<string, WorkspaceMember>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Load memberships for all workspaces
  useEffect(() => {
    const loadMemberships = async () => {
      if (!user || workspaces.length === 0) return;

      const membershipPromises = workspaces.map(async (workspace) => {
        const membership = await getUserMembership(workspace.id, user.id);
        return { workspaceId: workspace.id, membership };
      });

      const results = await Promise.all(membershipPromises);
      const membershipMap: Record<string, WorkspaceMember> = {};
      
      results.forEach(({ workspaceId, membership }) => {
        if (membership) {
          membershipMap[workspaceId] = membership;
        }
      });

      setMemberships(membershipMap);
    };

    loadMemberships();
  }, [user, workspaces]);

  const handleEnterWorkspace = async (workspaceId: string) => {
    const success = await selectWorkspace(workspaceId);
    if (success) {
      navigate(`/app/workspaces/${workspaceId}/dashboard`);
    } else {
      showError('Failed to enter workspace', 'Please try again');
    }
  };

  // Filter workspaces based on search term
  const filteredWorkspaces = workspaces.filter(workspace =>
    workspace.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workspace.standard.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          <p className="text-slate-600 dark:text-slate-400 font-medium">Loading workspaces...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Header Section */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 relative overflow-hidden">
        {/* Subtle decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 blur-3xl rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-500/5 blur-3xl rounded-full -ml-24 -mb-24"></div>

        <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary-500/20">
                  <span className="text-white font-bold text-base">L</span>
                </div>
                <span className="text-xs font-bold tracking-wider text-primary-600 uppercase">LMA Nexus</span>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Workspace Hub
              </h1>
              <p className="mt-1 text-base text-slate-500 dark:text-slate-400 max-w-2xl">
                Manage your syndicated loan deals and collaborate with your team.
              </p>
            </div>
            
            <div className="flex items-center space-x-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
               <div className="text-right">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{user?.name || 'User'}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
               </div>
               <div className="h-10 w-10 rounded-xl bg-primary-600 flex items-center justify-center text-white font-bold shadow-lg shadow-primary-500/20">
                  {user?.name?.charAt(0) || 'U'}
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Search and Create Toolbar */}
        <div className="flex flex-col gap-6 mb-8 sm:flex-row sm:items-center justify-between">
          <div className="flex-1 max-w-lg relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-slate-400 group-focus-within:text-primary-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <Input
              placeholder="Search workspaces or standards..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 w-full h-12 text-base bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl focus:ring-primary-500 focus:border-primary-500 shadow-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              onClick={() => setShowCreateModal(true)}
              className="h-12 px-6 bg-primary-600 hover:bg-primary-700 text-white border-none rounded-xl shadow-lg shadow-primary-500/25 transform transition-all active:scale-[0.98]"
            >
              <svg className="w-5 h-5 mr-2 -ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Workspace
            </Button>
            <Button 
              variant="secondary"
              onClick={() => {logout(); window.location.reload();}}
              className="h-12 px-6 border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Logout
            </Button>
          </div>
        </div>

        {/* Workspace Grid */}
        {filteredWorkspaces.length === 0 ? (
          searchTerm ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-slate-200 dark:border-slate-800 shadow-sm">
              <EmptyState
                icon={
                  <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                }
                title="No workspaces found"
                description={`We couldn't find any workspaces matching "${searchTerm}".`}
              />
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-slate-200 dark:border-slate-800 shadow-sm">
              <EmptyState
                icon={
                  <div className="w-20 h-20 bg-primary-50 dark:bg-primary-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                }
                title="Your workspace is empty"
                description="Get started by creating your first workspace to manage your deal documentation."
                action={
                  <Button
                    variant="primary"
                    onClick={() => setShowCreateModal(true)}
                    className="mt-6 bg-primary-600 hover:bg-primary-700 text-white border-none rounded-xl shadow-lg shadow-primary-500/25"
                  >
                    Create Workspace
                  </Button>
                }
              />
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredWorkspaces.map((workspace) => {
              const membership = memberships[workspace.id];
              if (!membership) return null;

              return (
                <WorkspaceCard
                  key={workspace.id}
                  workspace={workspace}
                  membership={membership}
                  onEnter={handleEnterWorkspace}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Create Workspace Modal */}
      <CreateWorkspaceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={(workspace) => {
          // Workspace list will be refreshed automatically by the provider
          console.log('Workspace created:', workspace.name);
        }}
      />
    </div>
  );
};

export default WorkspaceHub;