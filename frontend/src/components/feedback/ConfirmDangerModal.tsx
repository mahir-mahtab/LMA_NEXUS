import React, { useState } from 'react';
import Modal from './Modal';
import { Button, Input } from '../ui';

export interface ConfirmDangerModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmationPhrase?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
  warningText?: string;
}

const ConfirmDangerModal: React.FC<ConfirmDangerModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  confirmationPhrase,
  onConfirm,
  onCancel,
  isProcessing = false,
  warningText
}) => {
  const [confirmationInput, setConfirmationInput] = useState('');

  const handleClose = () => {
    setConfirmationInput('');
    onCancel();
  };

  const handleConfirm = () => {
    onConfirm();
    setConfirmationInput('');
  };

  const isConfirmationValid = confirmationPhrase 
    ? confirmationInput.trim() === confirmationPhrase 
    : true;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      showCancel={false}
      className="max-w-md"
    >
      <div className="space-y-4">
        {/* Warning Icon */}
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full">
          <svg 
            className="w-6 h-6 text-red-600 dark:text-red-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
            />
          </svg>
        </div>

        {/* Message */}
        <div className="text-center">
          <p className="text-gray-900 dark:text-white">
            {message}
          </p>
          {warningText && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium">
              {warningText}
            </p>
          )}
        </div>

        {/* Confirmation Input */}
        {confirmationPhrase && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              To confirm, type <span className="font-mono font-semibold text-gray-900 dark:text-white">
                {confirmationPhrase}
              </span> in the box below:
            </p>
            <Input
              value={confirmationInput}
              onChange={(e) => setConfirmationInput(e.target.value)}
              placeholder={confirmationPhrase}
              disabled={isProcessing}
              autoComplete="off"
              className="font-mono"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isProcessing}
          >
            {cancelText}
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirm}
            disabled={isProcessing || !isConfirmationValid}
            loading={isProcessing}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDangerModal;