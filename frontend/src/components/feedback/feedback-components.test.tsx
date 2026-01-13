import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Modal from './Modal';
import ReasonModal from './ReasonModal';
import Toast from './Toast';
import ConfirmDangerModal from './ConfirmDangerModal';
import { ToastProvider, useToast } from './ToastContainer';
import { ReasonCategory } from '../../types';

describe('Feedback Components', () => {
  describe('Modal', () => {
    it('renders correctly when open', () => {
      const onClose = jest.fn();
      render(
        <Modal isOpen={true} onClose={onClose} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      );

      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByText('Modal content')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      const onClose = jest.fn();
      render(
        <Modal isOpen={false} onClose={onClose} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      );

      expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
    });

    it('calls onClose when cancel button is clicked', () => {
      const onClose = jest.fn();
      render(
        <Modal isOpen={true} onClose={onClose} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      );

      fireEvent.click(screen.getByText('Cancel'));
      expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose when ESC key is pressed', () => {
      const onClose = jest.fn();
      render(
        <Modal isOpen={true} onClose={onClose} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      );

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('ReasonModal', () => {
    const reasonCategories: ReasonCategory[] = ['borrower_request', 'market_conditions', 'other'];

    it('renders correctly', () => {
      const onSubmit = jest.fn();
      const onCancel = jest.fn();
      
      render(
        <ReasonModal
          isOpen={true}
          title="Provide Reason"
          reasonCategories={reasonCategories}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      expect(screen.getByText('Provide Reason')).toBeInTheDocument();
      expect(screen.getByLabelText('Category')).toBeInTheDocument();
      expect(screen.getByLabelText('Reason')).toBeInTheDocument();
    });

    it('validates required reason', async () => {
      const onSubmit = jest.fn();
      const onCancel = jest.fn();
      
      render(
        <ReasonModal
          isOpen={true}
          title="Provide Reason"
          reasonCategories={reasonCategories}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      // Initially the confirm button should be disabled due to empty reason
      const confirmButton = screen.getByText('Confirm');
      expect(confirmButton).toBeDisabled();

      // Add a short reason (less than 10 characters)
      const reasonTextarea = screen.getByLabelText('Reason');
      fireEvent.change(reasonTextarea, { target: { value: 'short' } });
      
      // Now button should be enabled but clicking should show validation error
      expect(confirmButton).not.toBeDisabled();
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.getByText('Reason must be at least 10 characters')).toBeInTheDocument();
      });
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('submits with valid data', () => {
      const onSubmit = jest.fn();
      const onCancel = jest.fn();
      
      render(
        <ReasonModal
          isOpen={true}
          title="Provide Reason"
          reasonCategories={reasonCategories}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      const reasonTextarea = screen.getByLabelText('Reason');
      fireEvent.change(reasonTextarea, { target: { value: 'This is a valid reason for the action' } });
      
      fireEvent.click(screen.getByText('Confirm'));
      expect(onSubmit).toHaveBeenCalledWith('This is a valid reason for the action', 'borrower_request');
    });
  });

  describe('Toast', () => {
    it('renders success toast correctly', () => {
      const onDismiss = jest.fn();
      render(
        <Toast
          id="test-toast"
          variant="success"
          title="Success!"
          message="Operation completed"
          onDismiss={onDismiss}
        />
      );

      expect(screen.getByText('Success!')).toBeInTheDocument();
      expect(screen.getByText('Operation completed')).toBeInTheDocument();
    });

    it('renders error toast correctly', () => {
      const onDismiss = jest.fn();
      render(
        <Toast
          id="test-toast"
          variant="error"
          title="Error!"
          message="Something went wrong"
          onDismiss={onDismiss}
        />
      );

      expect(screen.getByText('Error!')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('calls onDismiss when dismiss button is clicked', async () => {
      const onDismiss = jest.fn();
      render(
        <Toast
          id="test-toast"
          variant="info"
          title="Info"
          onDismiss={onDismiss}
        />
      );

      const dismissButton = screen.getByLabelText('Dismiss notification');
      fireEvent.click(dismissButton);
      
      // Wait for the exit animation to complete
      await waitFor(() => {
        expect(onDismiss).toHaveBeenCalledWith('test-toast');
      }, { timeout: 500 });
    });
  });

  describe('ConfirmDangerModal', () => {
    it('renders correctly', () => {
      const onConfirm = jest.fn();
      const onCancel = jest.fn();
      
      render(
        <ConfirmDangerModal
          isOpen={true}
          title="Confirm Deletion"
          message="Are you sure you want to delete this item?"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      expect(screen.getByText('Confirm Deletion')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to delete this item?')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('requires confirmation phrase when provided', () => {
      const onConfirm = jest.fn();
      const onCancel = jest.fn();
      
      render(
        <ConfirmDangerModal
          isOpen={true}
          title="Confirm Deletion"
          message="Are you sure?"
          confirmationPhrase="DELETE"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      const deleteButton = screen.getByText('Delete');
      expect(deleteButton).toBeDisabled();

      const input = screen.getByPlaceholderText('DELETE');
      fireEvent.change(input, { target: { value: 'DELETE' } });
      
      expect(deleteButton).not.toBeDisabled();
    });

    it('calls onConfirm when confirmed', () => {
      const onConfirm = jest.fn();
      const onCancel = jest.fn();
      
      render(
        <ConfirmDangerModal
          isOpen={true}
          title="Confirm Deletion"
          message="Are you sure?"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      fireEvent.click(screen.getByText('Delete'));
      expect(onConfirm).toHaveBeenCalled();
    });
  });

  describe('ToastProvider', () => {
    const TestComponent = () => {
      const { addToast } = useToast();
      
      return (
        <button onClick={() => addToast({ variant: 'success', title: 'Test Toast' })}>
          Add Toast
        </button>
      );
    };

    it('provides toast context', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText('Add Toast'));
      expect(screen.getByText('Test Toast')).toBeInTheDocument();
    });
  });
});