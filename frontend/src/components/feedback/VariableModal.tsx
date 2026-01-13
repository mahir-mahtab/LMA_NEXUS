/**
 * VariableModal - Modal for binding and editing variables
 * Requirements: 4.4
 */

import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Button, Input, Select } from '../ui';
import { Variable, VariableType } from '../../types/document';

export interface VariableModalProps {
  isOpen: boolean;
  title: string;
  variable?: Variable; // If provided, we're editing; otherwise, we're creating
  onSubmit: (data: VariableFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export interface VariableFormData {
  label: string;
  type: VariableType;
  value: string;
  unit?: string;
}

const VariableModal: React.FC<VariableModalProps> = ({
  isOpen,
  title,
  variable,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState<VariableFormData>({
    label: '',
    type: 'financial',
    value: '',
    unit: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof VariableFormData, string>>>({});

  // Reset form when modal opens/closes or variable changes
  useEffect(() => {
    if (isOpen) {
      if (variable) {
        // Editing existing variable
        setFormData({
          label: variable.label,
          type: variable.type,
          value: variable.value,
          unit: variable.unit || '',
        });
      } else {
        // Creating new variable
        setFormData({
          label: '',
          type: 'financial',
          value: '',
          unit: '',
        });
      }
      setErrors({});
    }
  }, [isOpen, variable]);

  // Variable type options
  const typeOptions = [
    { value: 'financial', label: 'Financial' },
    { value: 'definition', label: 'Definition' },
    { value: 'covenant', label: 'Covenant' },
    { value: 'ratio', label: 'Ratio' },
  ];

  // Common unit options
  const unitOptions = [
    { value: '', label: 'No unit' },
    { value: '%', label: 'Percentage (%)' },
    { value: 'bps', label: 'Basis Points (bps)' },
    { value: 'x', label: 'Multiple (x)' },
    { value: 'USD', label: 'US Dollars (USD)' },
    { value: 'EUR', label: 'Euros (EUR)' },
    { value: 'GBP', label: 'British Pounds (GBP)' },
    { value: 'days', label: 'Days' },
    { value: 'months', label: 'Months' },
    { value: 'years', label: 'Years' },
  ];

  const handleInputChange = (field: keyof VariableFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof VariableFormData, string>> = {};

    // Validate label
    if (!formData.label.trim()) {
      newErrors.label = 'Label is required';
    } else if (formData.label.trim().length < 2) {
      newErrors.label = 'Label must be at least 2 characters';
    } else if (formData.label.trim().length > 100) {
      newErrors.label = 'Label must be less than 100 characters';
    }

    // Validate type
    if (!formData.type) {
      newErrors.type = 'Type is required';
    }

    // Validate value
    if (!formData.value.trim()) {
      newErrors.value = 'Value is required';
    } else if (formData.value.trim().length > 500) {
      newErrors.value = 'Value must be less than 500 characters';
    }

    // Validate unit (optional, but if provided should be reasonable length)
    if (formData.unit && formData.unit.length > 20) {
      newErrors.unit = 'Unit must be less than 20 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit({
        label: formData.label.trim(),
        type: formData.type,
        value: formData.value.trim(),
        unit: formData.unit?.trim() || undefined,
      });
    }
  };

  const handleClose = () => {
    setFormData({
      label: '',
      type: 'financial',
      value: '',
      unit: '',
    });
    setErrors({});
    onCancel();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      showCancel={false}
      className="max-w-lg"
    >
      <div className="space-y-6">
        {/* Label Input */}
        <div>
          <Input
            label="Variable Label"
            value={formData.label}
            onChange={(e) => handleInputChange('label', e.target.value)}
            placeholder="e.g., Applicable Margin, EBITDA Definition"
            error={errors.label}
            disabled={isSubmitting}
            required
            className="rounded-xl border-slate-200 dark:border-slate-800 focus:ring-primary-500/20"
          />
          <div className="mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            A descriptive name for this variable
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Type Selection */}
          <div>
            <Select
              label="Variable Type"
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              options={typeOptions}
              error={errors.type}
              disabled={isSubmitting}
              required
              className="rounded-xl border-slate-200 dark:border-slate-800 focus:ring-primary-500/20"
            />
          </div>

          {/* Unit Selection */}
          <div>
            <Select
              label="Unit (Optional)"
              value={formData.unit || ''}
              onChange={(e) => handleInputChange('unit', e.target.value)}
              options={unitOptions}
              error={errors.unit}
              disabled={isSubmitting}
              className="rounded-xl border-slate-200 dark:border-slate-800 focus:ring-primary-500/20"
            />
          </div>
        </div>

        {/* Value Input */}
        <div>
          <Input
            label="Value"
            value={formData.value}
            onChange={(e) => handleInputChange('value', e.target.value)}
            placeholder="e.g., 2.50, LIBOR + 250bps, 3.0x"
            error={errors.value}
            disabled={isSubmitting}
            required
            className="rounded-xl border-slate-200 dark:border-slate-800 focus:ring-primary-500/20"
          />
          <div className="mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            The current value of this variable
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
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.label.trim() || !formData.value.trim()}
            loading={isSubmitting}
            className="h-10 px-6 bg-primary-600 hover:bg-primary-700 text-white border-none rounded-xl shadow-lg shadow-primary-500/20 font-bold text-xs"
          >
            {variable ? 'Update Variable' : 'Bind Variable'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default VariableModal;