import React from 'react';
import { Outlet } from 'react-router-dom';
import { LockIcon } from 'lucide-react';
import { EmptyState } from '../ui/EmptyState';
import { useAppData } from '../../contexts/AppDataContext';
import type { OboPermission } from '../../types';

/** A screen shown in place of a route the user cannot open. */
export function NoAccess({ title, description }: {title: string;description: string;}) {
  return (
    <div className="px-8 py-10">
      <EmptyState icon={LockIcon} title={title} description={description} />
    </div>);

}

/**
 * Wraps every Onboarding & Offboarding route. The module is unavailable when the tenant has not
 * purchased it, and a screen is unavailable when `allowed` says the user lacks its permission.
 */
export function OboAccessGate({
  allowed,
  children



}: {allowed?: (permissions: OboPermission[]) => boolean;children?: React.ReactNode;}) {
  const { oboModulePurchased, oboPermissions } = useAppData();

  if (!oboModulePurchased) {
    return (
      <NoAccess
        title="Onboarding & Offboarding is not enabled"
        description="Your organisation has not purchased this module. Contact your administrator to enable it." />);


  }
  if (allowed && !allowed(oboPermissions)) {
    return (
      <NoAccess
        title="You don't have access to this screen"
        description="Ask your administrator for the Onboarding & Offboarding permission this screen needs." />);


  }
  return <>{children ?? <Outlet />}</>;
}
