/**
 * Unit tests for WorkspaceHub component
 * Tests the empty state with CTA functionality
 * Requirements: 2.1
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';

describe('WorkspaceHub Empty State', () => {
  test('EmptyState component renders with title and description', () => {
    render(
      <EmptyState
        title="No workspaces yet"
        description="Create your first workspace to start managing deal documentation."
      />
    );

    expect(screen.getByText('No workspaces yet')).toBeInTheDocument();
    expect(screen.getByText('Create your first workspace to start managing deal documentation.')).toBeInTheDocument();
  });

  test('EmptyState component renders with CTA button', () => {
    const mockOnClick = jest.fn();
    
    render(
      <EmptyState
        title="No workspaces yet"
        description="Create your first workspace to start managing deal documentation."
        action={
          <Button variant="primary" onClick={mockOnClick}>
            Create Workspace
          </Button>
        }
      />
    );

    expect(screen.getByText('Create Workspace')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Workspace' })).toBeInTheDocument();
  });

  test('EmptyState component renders with icon', () => {
    render(
      <EmptyState
        icon={
          <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" data-testid="workspace-icon">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        }
        title="No workspaces yet"
        description="Create your first workspace to start managing deal documentation."
      />
    );

    expect(screen.getByTestId('workspace-icon')).toBeInTheDocument();
  });

  test('EmptyState component has proper structure and styling', () => {
    render(
      <EmptyState
        title="No workspaces yet"
        description="Create your first workspace to start managing deal documentation."
      />
    );

    const title = screen.getByText('No workspaces yet');
    const description = screen.getByText('Create your first workspace to start managing deal documentation.');

    // Check that elements have appropriate classes for styling
    expect(title).toHaveClass('font-semibold');
    expect(description).toHaveClass('text-gray-500');
  });
});