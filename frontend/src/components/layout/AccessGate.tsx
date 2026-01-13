/**
 * AccessGate Component
 * Hide/disable content based on permission with tooltip for disabled state
 * Requirements: 3.3
 */

import React, { cloneElement, isValidElement } from 'react';
import { clsx } from 'clsx';
import { usePermission } from '../../stores/PermissionProvider';
import { Permission } from '../../types/permissions';

interface AccessGateProps {
  /** Single permission required */
  permission?: Permission;
  /** Multiple permissions - user needs ANY of these */
  permissions?: Permission[];
  /** Multiple permissions - user needs ALL of these */
  requireAll?: Permission[];
  /** Content to render when user has permission */
  children: React.ReactNode;
  /** Content to render when user lacks permission (if showDisabled is false) */
  fallback?: React.ReactNode;
  /** Show disabled version instead of hiding completely */
  showDisabled?: boolean;
  /** Tooltip text to show when disabled */
  disabledTooltip?: string;
  /** Additional CSS classes */
  className?: string;
}

const AccessGate: React.FC<AccessGateProps> = ({
  permission,
  permissions,
  requireAll,
  children,
  fallback = null,
  showDisabled = false,
  disabledTooltip,
  className
}) => {
  const { can, canAny, canAll } = usePermission();

  // Determine if user has required permissions
  const hasPermission = (): boolean => {
    if (permission) {
      return can(permission);
    }
    
    if (permissions && permissions.length > 0) {
      return canAny(permissions);
    }
    
    if (requireAll && requireAll.length > 0) {
      return canAll(requireAll);
    }
    
    // No permissions specified - allow access
    return true;
  };

  const userHasPermission = hasPermission();

  // If user has permission, render children normally
  if (userHasPermission) {
    return <>{children}</>;
  }

  // If user lacks permission and we should show disabled version
  if (showDisabled && isValidElement(children)) {
    // Clone the child element and add disabled props
    const childProps = children.props as any;
    const disabledProps: any = {
      disabled: true,
      'aria-disabled': true,
      className: clsx(childProps.className, 'opacity-50 cursor-not-allowed'),
    };
    
    const disabledChild = cloneElement(children, disabledProps);

    // Wrap with tooltip if provided
    if (disabledTooltip) {
      return (
        <div className={clsx('relative group', className)}>
          {disabledChild}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            {disabledTooltip}
          </div>
        </div>
      );
    }

    return disabledChild;
  }

  // If user lacks permission and we should hide completely, show fallback
  return <>{fallback}</>;
};

export default AccessGate;