import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function AppShell() {
  return (
    <div className="flex h-full w-full bg-canvas">
      <Sidebar />
      <main className="scroll-thin flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>);

}