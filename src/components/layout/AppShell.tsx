import React, { createContext, useContext, useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

interface SidebarControl {
  open: boolean;
  toggle: () => void;
}

const SidebarControlContext = createContext<SidebarControl | null>(null);

/** Lets a page's top bar show and hide the sidebar. Null outside the app shell. */
export function useSidebarControl(): SidebarControl | null {
  return useContext(SidebarControlContext);
}

export function AppShell() {
  const [open, setOpen] = useState(true);
  const control = useMemo(() => ({ open, toggle: () => setOpen((prev) => !prev) }), [open]);

  return (
    <SidebarControlContext.Provider value={control}>
      <div className="flex h-full w-full bg-canvas">
        {open && <Sidebar />}
        <main className="scroll-thin flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </SidebarControlContext.Provider>);

}
