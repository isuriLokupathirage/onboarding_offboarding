import React, { useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { ClipboardListIcon, MailIcon, PhoneIcon, UserMinusIcon } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Tabs } from '../../components/ui/Segmented';
import { Tooltip } from '../../components/ui/Tooltip';
import { FormStatusBadge } from '../../components/employees/FormStatusBadge';
import { FormAccessPanel } from '../../components/employees/FormAccessPanel';
import { SendFormDialog } from '../../components/employees/SendFormDialog';
import { useEmployeeData } from '../../contexts/EmployeeDataContext';
import { formatDate } from '../../utils/format';
import { useScreenInit } from '../../useScreenInit.js';

type Tab = 'basic' | 'access';

const PERMISSION_NOTE = 'Requires the Send Employee Forms permission';

export function EmployeeDetail() {
  const { employeeId } = useParams();
  const { employees, assignmentsFor, latestAssignment, canSendForms } = useEmployeeData();
  const screenInit = useScreenInit();
  const [tab, setTab] = useState<Tab>(screenInit.tab as Tab ?? 'basic');
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const employee = employees.find((item) => item.id === employeeId);
  if (!employee) return <Navigate to="/employees" replace />;

  const fullName = `${employee.firstName} ${employee.lastName}`;
  const assignments = assignmentsFor(employee.id);
  const latest = latestAssignment(employee.id);

  return (
    <div>
      <PageHeader
        title="Employee Details"
        subtitle="View and manage employee information"
        backTo="/employees"
        backLabel="Back to All Employees" />
      

      <div className="px-8 py-6">
        <section className="rounded-xl border border-line bg-white p-6 shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <Avatar name={fullName} size="lg" />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-ink">{fullName}</h2>
                  <Badge
                    className={
                    employee.status === 'Active' ?
                    'bg-emerald-50 text-emerald-700 ring-emerald-200' :
                    'bg-slate-100 text-slate-600 ring-slate-200'
                    }>
                    
                    {employee.status}
                  </Badge>
                </div>
                <p className="mt-1 text-[13px] text-muted">
                  {employee.jobTitle} · {employee.code}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[13px] text-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <MailIcon className="h-3.5 w-3.5 text-subtle" />
                    {employee.officialEmail}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <PhoneIcon className="h-3.5 w-3.5 text-subtle" />
                    {employee.mobile}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <p className="text-[11px] uppercase tracking-wide text-subtle">Employee form</p>
              <div className="mt-1 flex items-center justify-end gap-2">
                <FormStatusBadge status={latest?.status ?? 'Not Sent'} />
                {latest &&
                <span className="text-[12px] text-muted">
                    {latest.status === 'Submitted' ?
                  `Submitted ${formatDate(latest.submittedAt)}` :
                  `Expires ${formatDate(latest.expiresAt)}`}
                  </span>
                }
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
            {canSendForms ?
            <Button variant="primary" onClick={() => setSending(true)}>
                <MailIcon className="h-4 w-4" />
                Send Form
              </Button> :

            <Tooltip label={PERMISSION_NOTE}>
                <span>
                  <Button variant="primary" disabled>
                    <MailIcon className="h-4 w-4" />
                    Send Form
                  </Button>
                </span>
              </Tooltip>
            }
            <Button onClick={() => setTab('access')}>
              <ClipboardListIcon className="h-4 w-4" />
              Audit Trail
            </Button>
            <Button className="text-red-600 ring-red-200 hover:bg-red-50">
              <UserMinusIcon className="h-4 w-4" />
              {employee.status === 'Active' ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        </section>

        {notice &&
        <div className="mt-4 rounded-lg bg-emerald-50 px-3.5 py-3 text-[13px] text-emerald-900 ring-1 ring-inset ring-emerald-200">
            {notice}
          </div>
        }

        <div className="mt-6">
          <Tabs
            options={[
            { value: 'basic', label: 'Basic Info' },
            { value: 'access', label: 'Form Access', count: assignments.length }]
            }
            value={tab}
            onChange={setTab} />
          
        </div>

        <div className="mt-5">
          {tab === 'basic' ?
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <section className="rounded-xl border border-line bg-white p-5">
                <h3 className="text-[13px] font-semibold text-ink">Employment Details</h3>
                <dl className="mt-3 space-y-2.5">
                  <Row label="Employee ID" value={employee.code} />
                  <Row label="Official Email" value={employee.officialEmail} />
                  <Row label="Job Title" value={employee.jobTitle} />
                  <Row label="Department" value={employee.department} />
                  <Row label="Employment Type" value={employee.employmentType} />
                  <Row label="Client" value={employee.client} />
                  <Row label="Reporting Manager" value={employee.reportingManager} />
                  <Row label="Joined" value={formatDate(employee.joinedOn)} />
                </dl>
              </section>

              <section className="rounded-xl border border-line bg-white p-5">
                <h3 className="text-[13px] font-semibold text-ink">Personal Details</h3>
                <dl className="mt-3 space-y-2.5">
                  <Row label="Full Name" value={`${employee.firstName} ${employee.lastName}`} />
                  <Row label="NIC / Passport" value={employee.record.nic} />
                  <Row label="Date of Birth" value={formatDate(employee.record.dob)} />
                  <Row label="Nationality" value={employee.record.nationality} />
                  <Row label="Marital Status" value={employee.record.marital} />
                  <Row label="Mobile Number" value={employee.record.mobile} />
                  <Row label="Personal Email" value={employee.record.email} />
                  <Row label="Permanent Address" value={employee.record.permAddress} />
                  <Row label="Bank" value={`${employee.record.bankName} — ${employee.record.branchName}`} />
                  <Row label="Account Number" value={employee.record.accNumber} />
                </dl>
              </section>
            </div> :

          <FormAccessPanel employee={employee} onSendForm={() => setSending(true)} />
          }
        </div>
      </div>

      <SendFormDialog
        open={sending}
        recipients={[employee]}
        onClose={() => setSending(false)}
        onSent={(formName) => {
          setNotice(`${formName} was sent to ${employee.officialEmail}.`);
          setTab('access');
        }} />
      
    </div>);

}

function Row({ label, value }: {label: string;value?: string;}) {
  return (
    <div className="flex flex-wrap gap-x-3">
      <dt className="w-44 shrink-0 text-[13px] text-muted">{label}</dt>
      <dd className="text-[13px] text-ink">{value ?? '—'}</dd>
    </div>);

}