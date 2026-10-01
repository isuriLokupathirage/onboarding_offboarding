import React from 'react';
import { companyDetails } from '../../data/company';

export function PortalMessage({
  icon: Icon,
  title,
  body,
  tone = 'slate'





}: {icon: React.ComponentType<{className?: string;}>;title: string;body: string;tone?: 'red' | 'emerald' | 'slate';}) {
  const tones = {
    red: 'bg-red-50 text-red-600 ring-red-200',
    emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-200',
    slate: 'bg-slate-100 text-slate-600 ring-slate-200'
  };

  return (
    <div className="min-h-full w-full bg-white">
      <div className="border-b border-line bg-brand-50/50">
        <div className="mx-auto flex max-w-4xl items-center gap-2.5 px-6 py-5">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold text-white">
            A
          </span>
          <span className="text-sm font-semibold text-ink">Accxis 360</span>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-6 py-16">
        <div className="rounded-xl border border-line bg-white p-8 text-center">
          <span
            className={`inline-flex h-12 w-12 items-center justify-center rounded-full ring-1 ring-inset ${tones[tone]}`}>

            <Icon className="h-5 w-5" />
          </span>
          <h1 className="mt-4 text-base font-semibold text-ink">{title}</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">{body}</p>
          <dl className="mx-auto mt-5 w-fit space-y-1 rounded-lg bg-slate-50 px-4 py-3 text-left text-[13px] ring-1 ring-inset ring-line">
            <div className="flex gap-3">
              <dt className="w-12 text-muted">Email</dt>
              <dd>
                <a href={`mailto:${companyDetails.primaryEmail}`} className="text-brand-600 hover:underline">
                  {companyDetails.primaryEmail}
                </a>
              </dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-12 text-muted">Phone</dt>
              <dd>
                <a
                  href={`tel:${companyDetails.primaryPhone.replace(/\s/g, '')}`}
                  className="text-brand-600 hover:underline">

                  {companyDetails.primaryPhone}
                </a>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>);

}
