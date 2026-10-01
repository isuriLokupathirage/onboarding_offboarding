import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MailIcon, SendIcon, UsersIcon, XIcon } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Segmented } from '../../components/ui/Segmented';
import { SearchInput } from '../../components/ui/SearchInput';
import { Tooltip } from '../../components/ui/Tooltip';
import { EmptyState } from '../../components/ui/EmptyState';
import { FormStatusBadge } from '../../components/employees/FormStatusBadge';
import { SendFormDialog } from '../../components/employees/SendFormDialog';
import { useEmployeeData } from '../../contexts/EmployeeDataContext';
import { formatDate } from '../../utils/format';

type Filter = 'Active' | 'Inactive' | 'All';

const PERMISSION_NOTE = 'Requires the Send Employee Forms permission';

export function EmployeeList() {
  const { employees, latestAssignment, canSendForms } = useEmployeeData();
  const [filter, setFilter] = useState<Filter>('Active');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [sendingTo, setSendingTo] = useState<string[] | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return employees.
    filter((employee) => filter === 'All' || employee.status === filter).
    filter(
      (employee) =>
      !needle ||
      `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(needle) ||
      employee.code.toLowerCase().includes(needle) ||
      employee.officialEmail.toLowerCase().includes(needle) ||
      employee.jobTitle.toLowerCase().includes(needle)
    );
  }, [employees, filter, query]);

  const allVisibleSelected = visible.length > 0 && visible.every((e) => selected.includes(e.id));
  const recipients = sendingTo ?
  employees.filter((employee) => sendingTo.includes(employee.id)) :
  [];

  return (
    <div className="pb-24">
      <PageHeader
        title="All Employees"
        subtitle="Keep employee records current by sending forms they can confirm or correct themselves." />
      

      <div className="px-8 py-6">
        {notice &&
        <div className="mb-4 rounded-lg bg-emerald-50 px-3.5 py-3 text-[13px] text-emerald-900 ring-1 ring-inset ring-emerald-200">
            {notice}
          </div>
        }

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Segmented
            options={[
            {
              value: 'Active',
              label: 'Active',
              count: employees.filter((e) => e.status === 'Active').length
            },
            {
              value: 'Inactive',
              label: 'Inactive',
              count: employees.filter((e) => e.status === 'Inactive').length
            },
            { value: 'All', label: 'All', count: employees.length }]
            }
            value={filter}
            onChange={setFilter} />
          
          <div className="flex items-center gap-2">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search by name, email or ID"
              className="w-72" />
            

            {canSendForms ?
            <Button
              variant="primary"
              disabled={selected.length === 0}
              onClick={() => setSendingTo(selected)}>
              
                <SendIcon className="h-4 w-4" />
                Send Form
                {selected.length > 0 &&
              <span className="rounded bg-white/20 px-1.5 py-0.5 text-[11px] font-semibold">
                    {selected.length}
                  </span>
              }
              </Button> :

            <Tooltip label={PERMISSION_NOTE}>
                <span>
                  <Button variant="primary" disabled>
                    <SendIcon className="h-4 w-4" />
                    Send Form
                  </Button>
                </span>
              </Tooltip>
            }

            {selected.length > 0 &&
            <Button variant="ghost" onClick={() => setSelected([])} aria-label="Clear selection">
                <XIcon className="h-4 w-4" />
                Clear
              </Button>
            }
          </div>
        </div>

        {selected.length > 0 &&
        <p className="mt-3 text-[12px] text-muted">
            {selected.length} employee{selected.length === 1 ? '' : 's'} selected. Each one receives
            their own link at their official email address.
          </p>
        }

        <div className="mt-5 overflow-hidden rounded-xl border border-line bg-white shadow-card">
          <div className="grid grid-cols-12 items-center gap-4 border-b border-line bg-slate-50/70 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-subtle">
            <span className="col-span-1">
              <input
                type="checkbox"
                aria-label="Select all employees in view"
                checked={allVisibleSelected}
                onChange={() =>
                setSelected(allVisibleSelected ? [] : visible.map((employee) => employee.id))
                }
                className="h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-200" />
              
            </span>
            <span className="col-span-3">Employee</span>
            <span className="col-span-2">Job title</span>
            <span className="col-span-2">Department</span>
            <span className="col-span-3">Form status</span>
            <span className="col-span-1 text-right">Actions</span>
          </div>

          {visible.length === 0 ?
          <div className="p-6">
              <EmptyState
              icon={UsersIcon}
              title="No employees match this view"
              description="Adjust the status filter or clear the search." />
            
            </div> :

          <ul className="divide-y divide-line">
              {visible.map((employee) => {
              const assignment = latestAssignment(employee.id);
              const checked = selected.includes(employee.id);
              return (
                <li
                  key={employee.id}
                  className={`grid grid-cols-12 items-center gap-4 px-5 py-3.5 transition-colors duration-150 ease-out ${
                  checked ? 'bg-brand-50/40' : 'hover:bg-slate-50/60'}`
                  }>
                  
                    <span className="col-span-1">
                      <input
                      type="checkbox"
                      checked={checked}
                      aria-label={`Select ${employee.firstName} ${employee.lastName}`}
                      onChange={() =>
                      setSelected((prev) =>
                      prev.includes(employee.id) ?
                      prev.filter((id) => id !== employee.id) :
                      [...prev, employee.id]
                      )
                      }
                      className="h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-200" />
                    
                    </span>

                    <span className="col-span-3 flex items-center gap-3">
                      <Avatar name={`${employee.firstName} ${employee.lastName}`} size="md" />
                      <span className="min-w-0 leading-tight">
                        <Link
                        to={`/employees/${employee.id}`}
                        className="block truncate text-[13px] font-medium text-ink transition-colors duration-150 ease-out hover:text-brand-600">
                        
                          {employee.firstName} {employee.lastName}
                        </Link>
                        <span className="block truncate font-mono text-[11px] text-subtle">
                          {employee.code}
                        </span>
                      </span>
                    </span>

                    <span className="col-span-2 text-[13px] text-ink">{employee.jobTitle}</span>

                    <span className="col-span-2">
                      <span className="block text-[13px] text-ink">{employee.department}</span>
                      <span className="mt-0.5 block text-[12px] text-muted">
                        {employee.employmentType}
                      </span>
                    </span>

                    <span className="col-span-3 flex flex-wrap items-center gap-2">
                      <FormStatusBadge status={assignment?.status ?? 'Not Sent'} />
                      {assignment &&
                    <span className="text-[12px] text-muted">
                          {assignment.status === 'Submitted' ?
                      `Submitted ${formatDate(assignment.submittedAt)}` :
                      `Sent ${formatDate(assignment.sentAt)} · expires ${formatDate(
                        assignment.expiresAt
                      )}`}
                        </span>
                    }
                      {employee.status === 'Inactive' &&
                    <Badge className="bg-slate-100 text-slate-600 ring-slate-200">Inactive</Badge>
                    }
                    </span>

                    <span className="col-span-1 flex justify-end">
                      <Tooltip
                      label={
                      canSendForms ?
                      `Send a form to ${employee.firstName} ${employee.lastName}` :
                      PERMISSION_NOTE
                      }>
                      
                        <button
                        type="button"
                        disabled={!canSendForms}
                        onClick={() => setSendingTo([employee.id])}
                        aria-label={`Send a form to ${employee.firstName} ${employee.lastName}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-subtle transition-colors duration-150 ease-out hover:bg-brand-50 hover:text-brand-600 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent">
                        
                          <MailIcon className="h-4 w-4" />
                        </button>
                      </Tooltip>
                    </span>
                  </li>);

            })}
            </ul>
          }
        </div>

        {!canSendForms &&
        <p className="mt-3 text-[12px] text-muted">
            You do not have the Send Employee Forms (employee.form.send) permission, so sending,
            resending and revoking are unavailable.
          </p>
        }
      </div>

      <SendFormDialog
        open={Boolean(sendingTo)}
        recipients={recipients}
        onClose={() => setSendingTo(null)}
        onSent={(formNames, count) => {
          const what =
          formNames.length === 1 ? `${formNames[0]} was` : `${formNames.length} forms were`;
          setNotice(
            count === 1 ?
            `${what} sent to ${recipients[0]?.officialEmail}.` :
            `${what} sent to ${count} employees at their official email addresses.`
          );
          setSelected([]);
        }} />
      
    </div>);

}