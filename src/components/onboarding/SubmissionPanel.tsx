import { CheckCircle2Icon, FileWarningIcon, XIcon } from 'lucide-react';
import { Drawer } from '../ui/Drawer';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { FilePreviewButton, FileThumb } from '../ui/FilePreview';
import type {
  ConditionalGroup,
  EmailRecord,
  EmployeeForm,
  FormField,
  FormPart,
  FormSection,
  FormSubmission,
  SubmittedDocument } from
'../../types';
import { formatDate, formatDateTime } from '../../utils/format';

type Responses = Record<string, string>;

const visible = (fields: FormField[]) => fields.filter((field) => field.state !== 'Hidden');

/** A field's answer. A repeating row is keyed `fieldId#index`; older records keep row one under the plain id. */
function rawValue(responses: Responses, field: FormField, index?: number): string {
  if (index === undefined) return responses[field.id]?.trim() ?? '';
  return (responses[`${field.id}#${index}`] ?? (index === 0 ? responses[field.id] : undefined) ?? '').trim();
}

/** The answer as HR reads it: dates written out, and the typed text behind an "Other" choice. */
function displayValue(responses: Responses, field: FormField, index?: number): string {
  const value = rawValue(responses, field, index);
  if (!value) return '';
  if (field.dataType === 'Date' && /^\d{4}-\d{2}-\d{2}/.test(value)) return formatDate(value);
  if (field.allowOther && value === 'Other') {
    const key = index === undefined ? field.id : `${field.id}#${index}`;
    const other = responses[`${key}__other`]?.trim();
    return other ? `Other: ${other}` : 'Other';
  }
  return value;
}

/** How many rows a repeating block holds: the highest row answered, and at least one. */
function rowCount(responses: Responses, fields: FormField[]): number {
  const ids = new Set(fields.map((field) => field.id));
  let rows = fields.some((field) => responses[field.id]?.trim()) ? 1 : 0;
  Object.keys(responses).forEach((key) => {
    const [id, index] = key.split('#');
    if (index !== undefined && ids.has(id) && responses[key]?.trim()) rows = Math.max(rows, Number(index) + 1);
  });
  return Math.max(1, rows);
}

/** The sections the recipient saw: enabled, with at least one field that is not hidden. */
function shownSections(form: EmployeeForm): FormSection[] {
  if (!form.employeeDetailsEnabled) return [];
  return form.sections.filter(
    (section) =>
    section.enabled && (
    visible(section.fields).length > 0 ||
    (section.conditionalGroups ?? []).some(
      (group) => visible(group.fields).length > 0 || visible(group.repeating?.fields ?? []).length > 0
    ))
  );
}

/** Every answer slot in a section, as [answered, total], counting each repeating row and the group shown. */
function sectionCounts(section: FormSection, responses: Responses, groups: ConditionalGroup[]): [number, number] {
  let answered = 0;
  let total = 0;
  const tally = (fields: FormField[], rows?: number) => {
    visible(fields).forEach((field) => {
      for (let index = 0; index < (rows ?? 1); index += 1) {
        total += 1;
        if (rawValue(responses, field, rows === undefined ? undefined : index)) answered += 1;
      }
    });
  };
  if (section.repeating) tally(section.fields, rowCount(responses, section.fields));else
  tally(section.fields);
  groups.forEach((group) => {
    tally(group.fields);
    if (group.repeating) tally(group.repeating.fields, rowCount(responses, group.repeating.fields));
  });
  return [answered, total];
}

const PART_LABELS: Record<FormPart, string> = { details: 'Employee details', documents: 'Documents' };

/**
 * Transitions → [Transition] → Sent Forms → View Submission: the whole employee details form as the
 * candidate submitted it. Every section and field the form showed them appears in form order, with
 * unanswered fields marked rather than left out, followed by each requested document.
 */
export function SubmissionPanel({
  open,
  candidateName,
  form,
  email,
  submission,
  onClose
}: {
  open: boolean;
  candidateName: string;
  form: EmployeeForm | undefined;
  email?: EmailRecord;
  submission: FormSubmission | undefined;
  onClose: () => void;
}) {
  const responses = submission?.responses ?? {};
  const sections = form ? shownSections(form) : [];
  const civilStatus = responses.marital?.trim();
  const groupsFor = (section: FormSection) =>
  (section.conditionalGroups ?? []).filter((group) => group.condition === civilStatus);
  const counts = sections.map((section) => sectionCounts(section, responses, groupsFor(section)));
  const answered = counts.reduce((sum, [done]) => sum + done, 0);
  const total = counts.reduce((sum, [, all]) => sum + all, 0);

  const documents = submission?.documents ?? [];
  const requested = form?.documents ?? [];
  const filesFor = (name: string) => documents.filter((doc) => doc.name === name);
  const unrequested = documents.filter((doc) => !requested.some((item) => item.name === doc.name));
  const providedCount = requested.filter((item) => filesFor(item.name).length > 0).length;
  const parts = Object.entries(submission?.parts ?? {}) as [FormPart, string][];

  return (
    <Drawer
      open={open && Boolean(submission)}
      label={`Submission from ${candidateName}`}
      onClose={onClose}
      size="lg">

      {submission &&
      <>
          <div className="flex items-start justify-between gap-3 border-b border-line px-6 py-5">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">Form submission</p>
              <h2 className="mt-1 text-base font-semibold text-ink">
                {form?.name ?? email?.formName ?? 'Employee form'}
              </h2>
              <p className="mt-1 text-[13px] text-muted">
                <span className="font-mono text-[12px] text-subtle">{form?.code ?? email?.formCode}</span> ·
                submitted by {candidateName} on {formatDateTime(submission.submittedAt)}
              </p>
              {email &&
            <p className="mt-0.5 text-[12px] text-muted">
                  Sent {formatDate(email.sentAt)} to {email.recipient}
                </p>
            }
            </div>
            <button
            type="button"
            onClick={onClose}
            aria-label="Close submission"
            className="rounded-lg p-1.5 text-subtle transition-colors duration-150 ease-out hover:bg-slate-100 hover:text-ink">

              <XIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="scroll-thin flex-1 space-y-6 overflow-y-auto bg-slate-50/60 px-6 py-5">
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {sections.length > 0 &&
            <Stat label="Fields answered" value={`${answered} of ${total}`} />
            }
              {requested.length > 0 &&
            <Stat label="Documents provided" value={`${providedCount} of ${requested.length}`} />
            }
              {parts.length > 0 ?
            parts.map(([part, at]) =>
            <Stat key={part} label={`${PART_LABELS[part]} submitted`} value={formatDateTime(at)} />
            ) :

            <Stat label="Submitted" value={formatDateTime(submission.submittedAt)} />
            }
            </dl>

            {!form &&
          <p className="rounded-lg bg-white px-4 py-3 text-[13px] text-muted ring-1 ring-inset ring-line">
                This form's layout is no longer available, so only the uploaded documents are shown.
              </p>
          }

            {form && sections.length === 0 &&
          <p className="rounded-lg bg-white px-4 py-3 text-[13px] text-muted ring-1 ring-inset ring-line">
                {form.name} collects documents only. There are no employee details to show.
              </p>
          }

            {sections.map((section, sectionIndex) => {
            const [done, all] = counts[sectionIndex];
            const groups = groupsFor(section);
            const hasGroups = (section.conditionalGroups ?? []).length > 0;
            return (
              <section key={section.id} className="rounded-xl border border-line bg-white">
                  <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
                    <h3 className="text-[13px] font-semibold text-ink">{section.title}</h3>
                    {all > 0 &&
                  <span className={`text-[12px] ${done === all ? 'text-emerald-600' : 'text-muted'}`}>
                        {done} of {all} answered
                      </span>
                  }
                  </header>
                  <div className="space-y-3 p-4">
                    {section.repeating ?
                  <Rows
                    label={section.title}
                    fields={visible(section.fields)}
                    responses={responses} /> :


                  visible(section.fields).length > 0 && <Fields fields={visible(section.fields)} responses={responses} />
                  }

                    {hasGroups && groups.length === 0 &&
                  <p className="text-[13px] italic text-subtle">
                        {civilStatus ?
                    `Nothing further is asked for civil status ${civilStatus}.` :
                    'Civil status was not given, so the details that depend on it were not asked.'}
                      </p>
                  }
                    {groups.map((group) =>
                  <div key={group.id} className="rounded-lg border border-line">
                        <p className="border-b border-line bg-slate-50 px-3.5 py-2 text-[12px] font-medium text-ink">
                          {group.label}
                          <span className="ml-1.5 font-normal text-muted">· asked because civil status is {civilStatus}</span>
                        </p>
                        <div className="space-y-3 p-3.5">
                          {visible(group.fields).length > 0 &&
                      <Fields fields={visible(group.fields)} responses={responses} />
                      }
                          {group.repeating && visible(group.repeating.fields).length > 0 &&
                      <Rows
                        label={group.repeating.label}
                        fields={visible(group.repeating.fields)}
                        responses={responses} />

                      }
                        </div>
                      </div>
                  )}
                  </div>
                </section>);

          })}

            {(requested.length > 0 || documents.length > 0) &&
          <section className="rounded-xl border border-line bg-white">
                <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
                  <h3 className="text-[13px] font-semibold text-ink">Documents</h3>
                  {requested.length > 0 &&
              <span
                className={`text-[12px] ${providedCount === requested.length ? 'text-emerald-600' : 'text-muted'}`}>

                      {providedCount} of {requested.length} provided
                    </span>
              }
                </header>
                <ul className="divide-y divide-line">
                  {requested.map((item) =>
              <DocumentRow
                key={item.id}
                name={item.name}
                type={item.type}
                required={item.required}
                files={filesFor(item.name)} />

              )}
                  {unrequested.map((doc) =>
              <DocumentRow key={`${doc.name}-${doc.fileName}`} name={doc.name} files={[doc]} />
              )}
                </ul>
              </section>
          }
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-line px-6 py-4">
            <p className="text-[12px] text-muted">Submitted details are read-only and saved against this transition.</p>
            <Button onClick={onClose}>Close</Button>
          </div>
        </>
      }
    </Drawer>);

}

function Stat({ label, value }: {label: string;value: string;}) {
  return (
    <div className="rounded-lg bg-white px-3.5 py-2.5 ring-1 ring-inset ring-line">
      <dt className="text-[11px] font-medium uppercase tracking-wider text-subtle">{label}</dt>
      <dd className="mt-0.5 text-[13px] font-medium text-ink">{value}</dd>
    </div>);

}

/** A block of fields as label and answer pairs. Long text takes the full width. */
function Fields({ fields, responses, index }: {fields: FormField[];responses: Responses;index?: number;}) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
      {fields.map((field) => {
        const value = displayValue(responses, field, index);
        return (
          <div key={field.id} className={field.dataType === 'Long text' ? 'sm:col-span-2' : undefined}>
            <dt className="text-[12px] text-muted">
              {field.name}
              {field.state === 'Required' && <span className="ml-0.5 text-red-500">*</span>}
            </dt>
            <dd
              className={`mt-0.5 whitespace-pre-line break-words text-[13px] ${
              value ? 'text-ink' : 'italic text-subtle'}`
              }>

              {value || 'Not provided'}
            </dd>
          </div>);

      })}
    </dl>);

}

/** A repeating block, one numbered entry per row the candidate filled in. */
function Rows({ label, fields, responses }: {label: string;fields: FormField[];responses: Responses;}) {
  const rows = rowCount(responses, fields);
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }, (_, index) =>
      <div key={index} className="rounded-lg border border-line p-3.5">
          <p className="mb-2.5 text-[12px] font-medium text-muted">
            {rows > 1 ? `${label} ${index + 1}` : label}
          </p>
          <Fields fields={fields} responses={responses} index={index} />
        </div>
      )}
    </div>);

}

function DocumentRow({
  name,
  type,
  required,
  files
}: {name: string;type?: string;required?: boolean;files: SubmittedDocument[];}) {
  return (
    <li className="px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        {files.length > 0 ?
        <CheckCircle2Icon className="h-4 w-4 text-emerald-600" /> :
        <FileWarningIcon className="h-4 w-4 text-subtle" />
        }
        <span className="text-[13px] font-medium text-ink">{name}</span>
        {type && <span className="text-[12px] text-muted">{type}</span>}
        {required !== undefined &&
        <Badge
          className={required ? 'bg-brand-50 text-brand-700 ring-brand-200' : 'bg-sky-50 text-sky-700 ring-sky-200'}>

            {required ? 'Required' : 'Optional'}
          </Badge>
        }
      </div>
      {files.length === 0 ?
      <p className="ml-6 mt-1 text-[12px] italic text-subtle">Not uploaded</p> :

      <ul className="ml-6 mt-2 space-y-1.5">
          {files.map((doc) =>
        <li key={doc.fileName} className="flex items-center gap-3">
              <FileThumb name={doc.fileName} context={doc.name} />
              <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-ink">{doc.fileName}</span>
              <FilePreviewButton name={doc.fileName} context={doc.name} />
            </li>
        )}
        </ul>
      }
    </li>);

}
