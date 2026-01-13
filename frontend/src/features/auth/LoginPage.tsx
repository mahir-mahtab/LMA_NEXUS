/**
 * Login Page Component
 * Email/password authentication with validation and quick login for demo
 * Requirements: 1.1, 1.2
 */

import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../stores/AuthProvider';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { clsx } from 'clsx';

// Demo users for quick login
const DEMO_USERS = [
  { email: 'sarah.chen@bankco.com', password: 'Password123', role: 'Agent/Lead Arranger', name: 'Sarah Chen' },
  { email: 'james.wilson@legalfirm.com', password: 'Password123', role: 'Legal Counsel', name: 'James Wilson' },
  { email: 'maria.garcia@bankco.com', password: 'Password123', role: 'Risk/Credit', name: 'Maria Garcia' },
  { email: 'david.kim@investco.com', password: 'Password123', role: 'Investor/LP', name: 'David Kim' },
];

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

const LoginPage: React.FC = () => {
  const { isAuthenticated, login } = useAuth();
  const location = useLocation();
  
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDemoUser, setSelectedDemoUser] = useState<string>('');

  // Redirect if already authenticated
  const from = (location.state as any)?.from || '/app/workspaces';
  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  // Validation function
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const result = await login(formData.email, formData.password);
      
      if (!result.success) {
        setErrors({ general: result.error || 'Login failed' });
      }
      // If successful, the auth provider will handle the redirect
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value,
    }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary-500/20">
            <span className="text-white font-bold text-lg">L</span>
          </div>
          <span className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            LMA Nexus
          </span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
          Sign in to your account
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400">
          Enter your credentials to access the platform.
        </p>
      </div>

      {/* Login Form */}
      <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-soft dark:shadow-soft-dark mb-8 relative overflow-hidden">
        {/* Subtle accent line at the top */}
        <div className="absolute top-0 left-0 w-full h-1 bg-primary-600"></div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Error */}
          {errors.general && (
            <div className="p-4 border border-danger-200 rounded-xl bg-danger-50 dark:bg-danger-900/20 dark:border-danger-800">
              <p className="text-sm font-medium text-danger-700 dark:text-danger-300">
                {errors.general}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={handleInputChange('email')}
              error={errors.email}
              placeholder="name@company.com"
              autoComplete="email"
              required
              className="h-12 text-base focus:ring-primary-500 focus:border-primary-500"
            />

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <button type="button" className="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400">
                  Forgot password?
                </button>
              </div>
              <Input
                type="password"
                value={formData.password}
                onChange={handleInputChange('password')}
                error={errors.password}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                className="h-12 text-base focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={isLoading}
            className="w-full h-12 text-base font-semibold bg-primary-600 hover:bg-primary-700 text-white border-none rounded-xl shadow-lg shadow-primary-500/25 transform transition-all active:scale-[0.98]"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 mr-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Signing in...
              </div>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>
      </div>

      {/* Quick Login Demo Section */}
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Quick Demo Access
          </span>
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {DEMO_USERS.map((user) => (
            <button
              key={user.email}
              type="button"
              onClick={() => {
                setFormData({ email: user.email, password: user.password });
                setSelectedDemoUser(user.email);
                setErrors({});
              }}
              className={clsx(
                "flex flex-col items-start p-4 text-left border rounded-xl transition-all duration-200",
                selectedDemoUser === user.email
                  ? "border-primary-600 bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-600/20 shadow-md shadow-primary-500/10"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-primary-300 dark:hover:border-primary-800 hover:shadow-sm"
              )}
            >
              <span className="text-sm font-semibold text-slate-900 dark:text-white truncate w-full">
                {user.name}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 truncate w-full">
                {user.role}
              </span>
            </button>
          ))}
        </div>
        <p className="text-center text-xs text-slate-400">
          Demo accounts use password: <code className="font-mono text-slate-600 dark:text-slate-300">Password123</code>
        </p>
      </div>

      {/* Footer */}
      <div className="mt-16 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Don't have an account? <button className="font-semibold text-slate-900 dark:text-white hover:underline">Contact your administrator</button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;