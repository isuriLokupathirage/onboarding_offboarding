import React from 'react';

export function EmptyState({
  icon: Icon,
  title,
  description,
  action





}: {icon: React.ComponentType<{className?: string;}>;title: string;description?: string;action?: React.ReactNode;}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-white px-6 py-14 text-center">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
        <Icon className="h-5 w-5 text-subtle" />
      </span>
      <p className="mt-3 text-sm font-medium text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-[13px] text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>);

}