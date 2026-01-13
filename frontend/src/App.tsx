/**
 * Main App Component
 * Sets up routing and global providers
 * Requirements: 13.5
 */

import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './stores/AuthProvider';
import { ThemeProvider } from './stores/ThemeProvider';
import { WorkspaceProvider } from './stores/WorkspaceProvider';
import { PermissionProvider } from './stores/PermissionProvider';
import { AuditProvider } from './stores/AuditProvider';
import { ToastProvider } from './components/feedback/ToastContainer';
import router from './app/routes';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <WorkspaceProvider>
          <PermissionProvider>
            <AuditProvider>
              <ToastProvider>
                <RouterProvider router={router} />
              </ToastProvider>
            </AuditProvider>
          </PermissionProvider>
        </WorkspaceProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
