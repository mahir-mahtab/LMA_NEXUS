import React, { useState } from 'react';
import Modal from './Modal';
import { Button, Textarea, Select } from '../ui';
import { ReasonCategory } from '../../types';

export interface ReasonModalProps {
  isOpen: boolean;
  title: string;
  reasonCategories: ReasonCategory[];
  onSubmit: (reason: string, category: ReasonCategory) => void;
  onCancel: () => void;
  submitText?: string;
  cancelText?: string;
  reasonLabel?: string;
  categoryLabel?: string;
  reasonPlaceholder?: string;
  isSubmitting?: boolean;
}

const ReasonModal: React.FC<ReasonModalProps> = ({
  isOpen,
  title,
  reasonCategories,
  onSubmit,
  onCancel,
  submitText = 'Confirm',
  cancelText = 'Cancel',
  reasonLabel = 'Reason',
  categoryLabel = 'Category',
  reasonPlaceholder = 'Please provide a detailed reason for this action...',
  isSubmitting = false
}) => {
  const [reason, setReason] = useState('');
  const [category, setCategory] = useState<ReasonCategory>(reasonCategories[0] || 'other');
  const [errors, setErrors] = useState<{ reason?: string; category?: string }>({});

  const handleSubmit = () => {
    const newErrors: { reason?: string; category?: string } = {};

    // Validate reason
    if (!reason.trim()) {
      newErrors.reason = 'Reason is required';
    } else if (reason.trim().length < 10) {
      newErrors.reason = 'Reason must be at least 10 characters';
    }

    // Validate category
    if (!category || !reasonCategories.includes(category)) {
      newErrors.category = 'Please select a valid category';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onSubmit(reason.trim(), category);
      handleClose();
    }
  };

  const handleClose = () => {
    setReason('');
    setCategory(reasonCategories[0] || 'other');
    setErrors({});
    onCancel();
  };

  const categoryOptions = reasonCategories.map(cat => ({
    value: cat,
    label: formatCategoryLabel(cat)
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      showCancel={false}
      className="max-w-lg"
    >
      <div className="space-y-6">
        {/* Category Selection */}
        <div>
          <Select
            label={categoryLabel}
            value={category}
            onChange={(e) => setCategory(e.target.value as ReasonCategory)}
            options={categoryOptions}
            error={errors.category}
            disabled={isSubmitting}
            className="rounded-xl border-slate-200 dark:border-slate-800 focus:ring-primary-500/20"
          />
        </div>

        {/* Reason Textarea */}
        <div>
          <Textarea
            label={reasonLabel}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={reasonPlaceholder}
            rows={4}
            error={errors.reason}
            disabled={isSubmitting}
            required
            className="rounded-xl border-slate-200 dark:border-slate-800 focus:ring-primary-500/20"
          />
          <div className="mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex justify-end">
            {reason.length}/500 characters
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
            className="h-10 px-6 border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs"
          >
            {cancelText}
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isSubmitting || !reason.trim()}
            loading={isSubmitting}
            className="h-10 px-6 bg-primary-600 hover:bg-primary-700 text-white border-none rounded-xl shadow-lg shadow-primary-500/20 font-bold text-xs"
          >
            {submitText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Helper function to format category labels
function formatCategoryLabel(category: ReasonCategory): string {
  const labels: Record<ReasonCategory, string> = {
    borrower_request: 'Borrower Request',
    market_conditions: 'Market Conditions',
    credit_update: 'Credit Update',
    legal_requirement: 'Legal Requirement',
    other: 'Other'
  };
  return labels[category] || category;
}

export default ReasonModal;