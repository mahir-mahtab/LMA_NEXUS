/**
 * Route Definitions
 * Defines all application routes with proper nesting and protection
 * Requirements: 13.5
 */

import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';
import AppLayout from '../layouts/AppLayout';
import ProtectedRoute from './ProtectedRoute';
import WorkspaceRoute from './WorkspaceRoute';

// Lazy load pages for better performance
const LandingPage = React.lazy(() => import('../../features/landing/LandingPage'));
const LoginPage = React.lazy(() => import('../../features/auth/LoginPage'));
const WorkspaceHub = React.lazy(() => import('../../features/workspace/WorkspaceHub'));
const Dashboard = React.lazy(() => import('../../features/dashboard/Dashboard'));
const DraftingPage = React.lazy(() => import('../../features/drafting/DraftingPage'));
const ImpactMapPage = React.lazy(() => import('../../features/graph/ImpactMapPage'));
const CommercialDriftPage = React.lazy(() => import('../../features/drift/CommercialDriftPage'));
const AIReconciliationPage = React.lazy(() => import('../../features/reconciliation/AIReconciliationPage'));
const GoldenRecordPage = React.lazy(() => import('../../features/golden-record/GoldenRecordPage'));
const AdminPanelPage = React.lazy(() => import('../../features/admin/AdminPanelPage'));
const AuditLogPage = React.lazy(() => import('../../features/audit/AuditLogPage'));

// Error boundary component for route errors
const RouteErrorBoundary: React.FC<{ error: Error }> = ({ error }) => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-950">
    <div className="text-center">
      <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
        Something went wrong
      </h1>
      <p className="mb-4 text-gray-600 dark:text-gray-400">
        {error.message}
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 btn-primary"
      >
        Reload Page
      </button>
    </div>
  </div>
);

// Loading component for lazy routes
const RouteLoading: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-950">
    <div className="text-center">
      <div className="w-8 h-8 mx-auto mb-4 border-b-2 rounded-full animate-spin border-primary-600"></div>
      <p className="text-gray-600 dark:text-gray-400">Loading...</p>
    </div>
  </div>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <React.Suspense fallback={<RouteLoading />}>
        <LandingPage />
      </React.Suspense>
    ),
    errorElement: <RouteErrorBoundary error={new Error('Page not found')} />,
  },
  {
    path: '/login',
    element: <PublicLayout />,
    children: [
      {
        index: true,
        element: (
          <React.Suspense fallback={<RouteLoading />}>
            <LoginPage />
          </React.Suspense>
        ),
      },
    ],
  },
  {
    path: '/app',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorBoundary error={new Error('Application error')} />,
    children: [
      {
        index: true,
        element: <Navigate to="/app/workspaces" replace />,
      },
      {
        path: 'workspaces',
        element: (
          <React.Suspense fallback={<RouteLoading />}>
            <WorkspaceHub />
          </React.Suspense>
        ),
      },
      {
        path: 'workspaces/:workspaceId',
        element: <WorkspaceRoute />,
        children: [
          {
            index: true,
            element: <Navigate to="dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: (
              <React.Suspense fallback={<RouteLoading />}>
                <Dashboard />
              </React.Suspense>
            ),
          },
          {
            path: 'drafting',
            element: (
              <React.Suspense fallback={<RouteLoading />}>
                <DraftingPage />
              </React.Suspense>
            ),
          },
          {
            path: 'impact-map',
            element: (
              <React.Suspense fallback={<RouteLoading />}>
                <ImpactMapPage />
              </React.Suspense>
            ),
          },
          {
            path: 'commercial-drift',
            element: (
              <React.Suspense fallback={<RouteLoading />}>
                <CommercialDriftPage />
              </React.Suspense>
            ),
          },
          {
            path: 'ai-reconciliation',
            element: (
              <React.Suspense fallback={<RouteLoading />}>
                <AIReconciliationPage />
              </React.Suspense>
            ),
          },
          {
            path: 'golden-record',
            element: (
              <React.Suspense fallback={<RouteLoading />}>
                <GoldenRecordPage />
              </React.Suspense>
            ),
          },
          {
            path: 'admin',
            element: (
              <React.Suspense fallback={<RouteLoading />}>
                <AdminPanelPage />
              </React.Suspense>
            ),
          },
          {
            path: 'audit-log',
            element: (
              <React.Suspense fallback={<RouteLoading />}>
                <AuditLogPage />
              </React.Suspense>
            ),
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <RouteErrorBoundary error={new Error('Page not found')} />,
  },
]);

export default router;