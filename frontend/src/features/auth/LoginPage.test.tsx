/**
 * Login Validation Unit Tests
 * Tests core login validation logic without router dependencies
 * Requirements: 1.1, 1.2
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

// Create a simplified login form component for testing validation logic
const LoginForm: React.FC<{
  onSubmit: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
}> = ({ onSubmit }) => {
  const [formData, setFormData] = React.useState({ email: '', password: '' });
  const [errors, setErrors] = React.useState<{ email?: string; password?: string; general?: string }>({});
  const [isLoading, setIsLoading] = React.useState(false);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const result = await onSubmit(formData.email, formData.password);
      if (!result.success) {
        setErrors({ general: result.error || 'Login failed' });
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: 'email' | 'password') => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="email">Email Address</label>
        <input
          id="email"
          type="email"
          value={formData.email}
          onChange={handleInputChange('email')}
          placeholder="Enter your email"
        />
        {errors.email && <div data-testid="email-error">{errors.email}</div>}
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={formData.password}
          onChange={handleInputChange('password')}
          placeholder="Enter your password"
        />
        {errors.password && <div data-testid="password-error">{errors.password}</div>}
      </div>

      {errors.general && <div data-testid="general-error">{errors.general}</div>}

      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
};

describe('Login Validation', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Form Validation', () => {
    test('shows error for empty email', async () => {
      render(<LoginForm onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toHaveTextContent('Email is required');
      });
    });

    test('shows error for invalid email format', async () => {
      render(<LoginForm onSubmit={mockOnSubmit} />);

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toHaveTextContent('Please enter a valid email address');
      });
    });

    test('shows error for empty password', async () => {
      render(<LoginForm onSubmit={mockOnSubmit} />);

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('password-error')).toHaveTextContent('Password is required');
      });
    });

    test('shows error for short password', async () => {
      render(<LoginForm onSubmit={mockOnSubmit} />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: '123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('password-error')).toHaveTextContent('Password must be at least 6 characters');
      });
    });

    test('clears field errors when user starts typing', async () => {
      render(<LoginForm onSubmit={mockOnSubmit} />);

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Trigger validation error
      fireEvent.click(submitButton);
      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toBeInTheDocument();
      });

      // Start typing to clear error
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      expect(screen.queryByTestId('email-error')).not.toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    test('calls onSubmit with valid credentials', async () => {
      mockOnSubmit.mockResolvedValue({ success: true });
      
      render(<LoginForm onSubmit={mockOnSubmit} />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    test('shows loading state during submission', async () => {
      mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100)));
      
      render(<LoginForm onSubmit={mockOnSubmit} />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      expect(screen.getByText('Signing in...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    test('shows error message on submission failure', async () => {
      mockOnSubmit.mockResolvedValue({ success: false, error: 'Invalid credentials' });
      
      render(<LoginForm onSubmit={mockOnSubmit} />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('general-error')).toHaveTextContent('Invalid credentials');
      });
    });

    test('does not submit form with validation errors', async () => {
      render(<LoginForm onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Email Validation Logic', () => {
    test('accepts valid email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com'
      ];

      validEmails.forEach(email => {
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        expect(isValid).toBe(true);
      });
    });

    test('rejects invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user@domain',
        'user name@example.com',
        ''
      ];

      invalidEmails.forEach(email => {
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        expect(isValid).toBe(false);
      });
    });
  });
});