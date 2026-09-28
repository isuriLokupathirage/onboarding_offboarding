import React from 'react';
import { MailIcon } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Menu } from '../../components/ui/Menu';

const emails = [
{
  code: 'EML-001',
  name: 'Employee Data Form Invitation',
  subject: 'Welcome to Accxis Holdings — complete your employee data form',
  audience: 'New joiners',
  status: 'Active'
},
{
  code: 'EML-002',
  name: 'Document Upload Reminder',
  subject: 'A quick reminder about your onboarding documents',
  audience: 'New joiners',
  status: 'Active'
},
{
  code: 'EML-003',
  name: 'First Day Schedule',
  subject: 'Your first day schedule and office directions',
  audience: 'New joiners',
  status: 'Active'
},
{
  code: 'EML-004',
  name: 'Exit Interview Invitation',
  subject: 'Exit interview schedule confirmation',
  audience: 'Leavers',
  status: 'Inactive'
}];


export function RecruitmentEmails() {
  return (
    <div>
      <PageHeader
        title="Recruitment Emails"
        subtitle="Templates used when inviting candidates to complete their onboarding steps."
        actions={<Button variant="primary">New Email</Button>} />
      
      <div className="px-8 py-6">
        <div className="overflow-hidden rounded-xl border border-line bg-white shadow-card">
          <ul className="divide-y divide-line">
            {emails.map((email) =>
            <li key={email.code} className="flex items-center gap-4 px-5 py-4">
                <MailIcon className="h-4 w-4 shrink-0 text-subtle" />
                <span className="w-20 font-mono text-[12px] text-subtle">{email.code}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-ink">{email.name}</p>
                  <p className="mt-0.5 truncate text-[12px] text-muted">{email.subject}</p>
                </div>
                <Badge>{email.audience}</Badge>
                <Badge
                className={
                email.status === 'Active' ?
                'bg-emerald-50 text-emerald-700 ring-emerald-200' :
                'bg-slate-100 text-slate-600 ring-slate-200'
                }>
                
                  {email.status}
                </Badge>
                <Menu
                label={`Actions for ${email.name}`}
                items={[{ label: 'Edit email' }, { label: 'Send test email' }, { label: 'Deactivate' }]} />
              
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>);

}