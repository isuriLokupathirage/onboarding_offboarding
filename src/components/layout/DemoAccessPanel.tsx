import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronUpIcon, FlaskConicalIcon, RotateCcwIcon } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { Avatar } from '../ui/Avatar';
import { useAppData } from '../../contexts/AppDataContext';
import { demoRoles, oboPermissionCatalogue } from '../../data/permissions';
import type { OboPermission } from '../../types';

const sameSet = (a: OboPermission[], b: OboPermission[]) =>
a.length === b.length && a.every((item) => b.includes(item));

/**
 * Prototype only. The signed-in user card opens a panel for trying the module as another role:
 * pick a ready-made role, switch single permissions, or simulate a tenant without the module.
 */
export function DemoAccessPanel() {
  const { oboPermissions, setOboPermissions, oboModulePurchased, setOboModulePurchased } = useAppData();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const role = demoRoles.find((item) => sameSet(item.permissions, oboPermissions));
  const roleName = role?.name ?? 'Custom access';

  const toggle = (permission: OboPermission) =>
  setOboPermissions(
    oboPermissions.includes(permission) ?
    oboPermissions.filter((item) => item !== permission) :
    [...oboPermissions, permission]
  );

  return (
    <div ref={ref} className="relative border-t border-line p-3">
      <AnimatePresence>
        {open &&
        <motion.div
          role="dialog"
          aria-label="Try another role"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
          className="scroll-thin absolute bottom-full left-3 right-3 z-40 mb-2 max-h-[70vh] overflow-y-auto rounded-xl border border-line bg-white p-3 shadow-pop">

            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-700">
              <FlaskConicalIcon className="h-3.5 w-3.5" />
              Prototype controls
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted">
              Try the Onboarding &amp; Offboarding module as another role. Changes apply straight away.
            </p>

            <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-subtle">Role</p>
            <div className="mt-1.5 space-y-1">
              {demoRoles.map((item) =>
            <button
              key={item.name}
              type="button"
              onClick={() => setOboPermissions(item.permissions)}
              aria-pressed={item === role}
              className={twMerge(
                'block w-full rounded-lg px-2.5 py-2 text-left transition-colors duration-150 ease-out',
                item === role ? 'bg-amber-50 ring-1 ring-inset ring-amber-200' : 'hover:bg-slate-50'
              )}>

                  <span className="block text-[13px] font-medium text-ink">{item.name}</span>
                  <span className="block text-[11px] leading-snug text-muted">{item.description}</span>
                </button>
            )}
            </div>

            <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-subtle">Permissions</p>
            <div className="mt-1.5 space-y-1.5">
              {oboPermissionCatalogue.map(({ permission, key }) =>
            <label key={permission} className="flex cursor-pointer items-start gap-2 text-[12px] text-ink">
                  <input
                type="checkbox"
                checked={oboPermissions.includes(permission)}
                onChange={() => toggle(permission)}
                className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-brand-500 focus:ring-brand-200" />

                  <span>
                    {permission}
                    {key && <span className="ml-1 font-mono text-[10px] text-subtle">{key}</span>}
                  </span>
                </label>
            )}
            </div>

            <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-subtle">Tenant</p>
            <label className="mt-1.5 flex cursor-pointer items-start gap-2 text-[12px] text-ink">
              <input
              type="checkbox"
              checked={oboModulePurchased}
              onChange={(event) => setOboModulePurchased(event.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-brand-500 focus:ring-brand-200" />

              Onboarding &amp; Offboarding module purchased
            </label>

            <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-[12px] font-medium text-muted ring-1 ring-line transition-colors duration-150 ease-out hover:bg-slate-50 hover:text-ink">

              <RotateCcwIcon className="h-3.5 w-3.5" />
              Reset sample data
            </button>
          </motion.div>
        }
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="dialog"
        title="Prototype: try another role"
        className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors duration-150 ease-out hover:bg-slate-50">

        <Avatar name="Nimal Perera" size="md" />
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-[13px] font-medium text-ink">Nimal Perera</span>
          <span className="block truncate text-[11px] text-muted">
            {roleName}
            {!oboModulePurchased && ' · module off'}
          </span>
        </span>
        <ChevronUpIcon
          className={twMerge('h-3.5 w-3.5 text-subtle transition-transform duration-150', !open && 'rotate-180')} />

      </button>
    </div>);

}
