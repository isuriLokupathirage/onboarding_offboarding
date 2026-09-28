import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileTextIcon, PlusIcon } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Segmented } from '../../components/ui/Segmented';
import { SearchInput } from '../../components/ui/SearchInput';
import { Badge } from '../../components/ui/Badge';
import { Menu } from '../../components/ui/Menu';
import { Tooltip } from '../../components/ui/Tooltip';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAppData } from '../../contexts/AppDataContext';

type Filter = 'Active' | 'Inactive' | 'All';

export function EmployeeForms() {
  const navigate = useNavigate();
  const { forms, updateForm, canManageForms, createForm, duplicateForm } = useAppData();
  const [filter, setFilter] = useState<Filter>('Active');
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return forms.
    filter((form) => !form.isDraft).
    filter((form) => filter === 'All' || form.status === filter).
    filter(
      (form) =>
      !needle ||
      form.name.toLowerCase().includes(needle) ||
      form.code.toLowerCase().includes(needle) ||
      form.employmentType.toLowerCase().includes(needle)
    );
  }, [forms, filter, query]);

  const countFields = (formId: string) => {
    const form = forms.find((item) => item.id === formId)!;
    if (!form.employeeDetailsEnabled) return 0;
    return form.sections.
    filter((section) => section.enabled).
    reduce(
      (total, section) =>
      total +
      section.fields.filter((field) => field.state !== 'Hidden').length +
      (section.conditionalGroups ?? []).reduce(
        (sum, group) =>
        sum +
        group.fields.filter((field) => field.state !== 'Hidden').length +
        (group.repeating?.fields ?? []).filter((field) => field.state !== 'Hidden').length,
        0
      ),
      0
    );
  };

  return (
    <div>
      <PageHeader
        title="Employee Forms"
        subtitle="Decide what each employment type is asked for, and which documents they must upload."
        actions={
        canManageForms ?
        <Button
          variant="primary"
          onClick={() => navigate(`/templates/forms/employee/${createForm()}`)}>
          
              <PlusIcon className="h-4 w-4" />
              New Form
            </Button> :

        <Tooltip label="Requires the Manage Employee Forms permission">
              <span>
                <Button variant="primary" disabled>
                  <PlusIcon className="h-4 w-4" />
                  New Form
                </Button>
              </span>
            </Tooltip>

        } />
      

      <div className="px-8 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Segmented
            options={[
            { value: 'Active', label: 'Active', count: forms.filter((f) => f.status === 'Active').length },
            {
              value: 'Inactive',
              label: 'Inactive',
              count: forms.filter((f) => f.status === 'Inactive').length
            },
            { value: 'All', label: 'All', count: forms.length }]
            }
            value={filter}
            onChange={setFilter} />
          
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search forms"
            className="w-72" />
          
        </div>

        <div className="mt-5 overflow-hidden rounded-xl border border-line bg-white shadow-card">
          <div className="grid grid-cols-12 gap-4 border-b border-line bg-slate-50/70 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-subtle">
            <span className="col-span-2">Form code</span>
            <span className="col-span-4">Form name</span>
            <span className="col-span-2 text-right">Fields</span>
            <span className="col-span-2 text-right">Documents</span>
            <span className="col-span-2 text-right">Status</span>
          </div>

          {visible.length === 0 ?
          <div className="p-6">
              <EmptyState
              icon={FileTextIcon}
              title="No forms match this view"
              description="Switch tabs or clear the search to see the rest of your forms." />
            
            </div> :

          <ul className="divide-y divide-line">
              {visible.map((form) =>
            <li
              key={form.id}
              className="grid grid-cols-12 items-center gap-4 px-5 py-3.5 transition-colors duration-150 ease-out hover:bg-slate-50/60">
              
                  <span className="col-span-2 font-mono text-[12px] text-subtle">{form.code}</span>
                  <span className="col-span-4">
                    <Link
                  to={`/templates/forms/employee/${form.id}`}
                  className="text-[13px] font-medium text-ink transition-colors duration-150 ease-out hover:text-brand-600">
                  
                      {form.name}
                    </Link>
                    <span className="mt-0.5 block text-[12px] text-muted">{form.employmentType}</span>
                  </span>
                  <span className="col-span-2 text-right text-[13px] text-ink">{countFields(form.id)}</span>
                  <span className="col-span-2 text-right text-[13px] text-ink">
                    {form.documents.length}
                  </span>
                  <span className="col-span-2 flex items-center justify-end gap-2">
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
                  items={
                  canManageForms ?
                  [
                  {
                    label: 'View form',
                    onSelect: () => navigate(`/templates/forms/employee/${form.id}`)
                  },
                  {
                    label: 'Duplicate form',
                    onSelect: () => {
                      const id = duplicateForm(form.id);
                      if (id) navigate(`/templates/forms/employee/${id}`);
                    }
                  },
                  {
                    label: form.status === 'Active' ? 'Deactivate' : 'Activate',
                    onSelect: () =>
                    updateForm(form.id, {
                      status: form.status === 'Active' ? 'Inactive' : 'Active'
                    })
                  }] :

                  [
                  {
                    label: 'View form',
                    onSelect: () => navigate(`/templates/forms/employee/${form.id}`)
                  }]

                  } />
                
                  </span>
                </li>
            )}
            </ul>
          }
        </div>
      </div>
    </div>);

}