import React from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Menu } from '../../components/ui/Menu';

const forms = [
{
  code: 'BGC-001',
  name: 'Standard Background Check',
  scope: 'Police clearance, two references, education verification',
  fields: 12,
  status: 'Active'
},
{
  code: 'BGC-002',
  name: 'Finance Role Background Check',
  scope: 'Police clearance, credit history, three references',
  fields: 16,
  status: 'Active'
},
{
  code: 'BGC-003',
  name: 'Intern Background Check',
  scope: 'Education verification only',
  fields: 6,
  status: 'Inactive'
}];


export function BackgroundCheckForms() {
  return (
    <div>
      <PageHeader
        title="Background Check Forms"
        subtitle="Verification packs requested from candidates before their start date."
        actions={<Button variant="primary">New Form</Button>} />
      
      <div className="px-8 py-6">
        <div className="overflow-hidden rounded-xl border border-line bg-white shadow-card">
          <ul className="divide-y divide-line">
            {forms.map((form) =>
            <li key={form.code} className="flex items-center gap-4 px-5 py-4">
                <span className="w-20 font-mono text-[12px] text-subtle">{form.code}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-ink">{form.name}</p>
                  <p className="mt-0.5 text-[12px] text-muted">{form.scope}</p>
                </div>
                <span className="text-[13px] text-ink">{form.fields} fields</span>
                <Badge
                className={
                form.status === 'Active' ?
                'bg-emerald-50 text-emerald-700 ring-emerald-200' :
                'bg-slate-100 text-slate-600 ring-slate-200'
                }>
                
                  {form.status}
                </Badge>
                <Menu
                label={`Actions for ${form.name}`}
                items={[{ label: 'Edit form' }, { label: 'Duplicate form' }, { label: 'Deactivate' }]} />
              
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>);

}