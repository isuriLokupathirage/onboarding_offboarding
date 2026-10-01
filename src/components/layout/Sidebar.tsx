import React, { useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  ChevronDownIcon,
  ClipboardListIcon,
  ExternalLinkIcon,
  FileTextIcon,
  LayersIcon,
  UserCheckIcon,
  UsersIcon } from
'lucide-react';
import { twMerge } from 'tailwind-merge';
import { SearchInput } from '../ui/SearchInput';
import { Avatar } from '../ui/Avatar';

interface NavLeaf {
  label: string;
  to: string;
}

interface NavGroup {
  heading?: string;
  items: NavLeaf[];
}

interface NavModule {
  id: string;
  label: string;
  icon: React.ComponentType<{className?: string;}>;
  basePath: string;
  groups: NavGroup[];
}

const modules: NavModule[] = [
{
  id: 'tasks',
  label: 'Tasks',
  icon: ClipboardListIcon,
  basePath: '/tasks',
  groups: [{ items: [{ label: 'My Tasks', to: '/tasks/my-tasks' }] }]
},
{
  id: 'onboarding',
  label: 'Onboarding & Offboarding',
  icon: UserCheckIcon,
  basePath: '/onboarding',
  groups: [
  {
    items: [
    { label: 'Overview', to: '/onboarding/overview' },
    { label: 'Transitions', to: '/onboarding/transitions' },
    { label: 'Templates', to: '/onboarding/templates' }]

  }]

},
{
  id: 'employees',
  label: 'Employee Management',
  icon: UsersIcon,
  basePath: '/employees',
  groups: [
  {
    items: [{ label: 'All Employees', to: '/employees' }]
  }]

},
{
  id: 'templates',
  label: 'Templates',
  icon: FileTextIcon,
  basePath: '/templates',
  groups: [
  {
    heading: 'Forms',
    items: [
    { label: 'Employee', to: '/templates/forms/employee' },
    { label: 'Background Check', to: '/templates/forms/background-check' }]

  },
  {
    heading: 'Emails',
    items: [{ label: 'Recruitment', to: '/templates/emails/recruitment' }]
  }]

}];


export function Sidebar() {
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return modules;
    return modules.
    map((module) => ({
      ...module,
      groups: module.groups.
      map((group) => ({
        ...group,
        items: group.items.filter(
          (item) =>
          item.label.toLowerCase().includes(needle) ||
          module.label.toLowerCase().includes(needle)
        )
      })).
      filter((group) => group.items.length > 0)
    })).
    filter((module) => module.groups.length > 0 || module.label.toLowerCase().includes(needle));
  }, [query]);

  return (
    <aside className="flex h-full w-[268px] shrink-0 flex-col border-r border-line bg-white">
      <div className="px-5 pb-3 pt-5">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold text-white">
            A
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-ink">Accxis 360</p>
            <p className="text-[11px] text-muted">Workforce Management</p>
          </div>
        </div>
      </div>

      <div className="px-5 pb-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-subtle">Modules</p>
        <SearchInput value={query} onChange={setQuery} placeholder="Search modules" />
      </div>

      <nav className="scroll-thin flex-1 overflow-y-auto px-3 pb-4" aria-label="Modules">
        {filtered.map((module) => {
          const isOpen = !collapsed.includes(module.id);
          const moduleActive = location.pathname.startsWith(module.basePath);
          return (
            <div key={module.id} className="mb-1">
              <button
                type="button"
                onClick={() =>
                setCollapsed((prev) =>
                prev.includes(module.id) ?
                prev.filter((id) => id !== module.id) :
                [...prev, module.id]
                )
                }
                aria-expanded={isOpen}
                className={twMerge(
                  'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium transition-colors duration-150 ease-out',
                  moduleActive ? 'text-ink' : 'text-muted hover:bg-slate-50 hover:text-ink'
                )}>
                
                <module.icon
                  className={twMerge('h-4 w-4 shrink-0', moduleActive ? 'text-brand-500' : 'text-subtle')} />
                
                <span className="flex-1 truncate">{module.label}</span>
                <ChevronDownIcon
                  className={twMerge(
                    'h-3.5 w-3.5 shrink-0 text-subtle transition-transform duration-150 ease-out',
                    !isOpen && '-rotate-90'
                  )} />
                
              </button>

              {isOpen &&
              <div className="mb-2 ml-4 border-l border-line pl-3">
                  {module.groups.map((group, index) =>
                <div key={group.heading ?? index} className="mt-1">
                      {group.heading &&
                  <p className="px-2.5 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-subtle">
                          {group.heading}
                        </p>
                  }
                      {group.items.map((item) =>
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                    twMerge(
                      'relative mb-0.5 block rounded-lg px-2.5 py-1.5 text-[13px] transition-colors duration-150 ease-out',
                      isActive ?
                      'bg-amber-50 font-medium text-amber-900' :
                      'text-muted hover:bg-slate-50 hover:text-ink'
                    )
                    }>
                    
                          {item.label}
                        </NavLink>
                  )}
                    </div>
                )}
                </div>
              }
            </div>);

        })}

        <div className="mt-4 border-t border-line pt-3">
          <NavLink
            to="/portal"
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-muted transition-colors duration-150 ease-out hover:bg-slate-50 hover:text-ink">
            
            <LayersIcon className="h-4 w-4 text-subtle" />
            <span className="flex-1">Candidate Portal</span>
            <ExternalLinkIcon className="h-3.5 w-3.5 text-subtle" />
          </NavLink>
        </div>
      </nav>

      <div className="border-t border-line p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <Avatar name="Nimal Perera" size="md" />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-[13px] font-medium text-ink">Nimal Perera</p>
            <p className="truncate text-[11px] text-muted">HR Manager</p>
          </div>
        </div>
      </div>
    </aside>);

}