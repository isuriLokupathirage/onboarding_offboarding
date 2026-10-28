import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  BoldIcon,
  InfoIcon,
  ItalicIcon,
  ListIcon,
  UploadCloudIcon,
  XIcon } from
'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { NoAccess } from '../../components/layout/AccessGate';
import { FilePreviewButton, FileThumb } from '../../components/ui/FilePreview';
import { Checkbox, FieldGroup, Input, Label, Select } from '../../components/ui/Field';
import { useAppData } from '../../contexts/AppDataContext';
import { departments, milestones } from '../../data/people';
import type { Department, Milestone, Priority, Task, TransitionKind } from '../../types';
import { rememberFiles } from '../../utils/filePreview';
import { wordCount } from '../../utils/format';
import { taskUsage, taskUsageLabel } from '../../utils/library';
import type { TemplatesScreenState } from './TaskTemplates';

type DueMode = 'none' | 'relative' | 'milestone';

/** Creates a task, or edits one when the route has a task id. */
export function CreateTask() {
  const navigate = useNavigate();
  const location = useLocation();
  const { taskId } = useParams();
  const { tasks, templates, transitions, addTask, updateTask, nextTaskCode, hasOboPermission } = useAppData();
  // Read once, so the form keeps its values while the user edits.
  const [editing] = useState<Task | undefined>(() => tasks.find((task) => task.id === taskId));
  const backState = (location.state ?? {}) as TemplatesScreenState;
  const kind: TransitionKind = editing?.kind ?? backState.kind ?? 'Onboarding';
  const rule = editing?.dueRule ?? null;
  const editorRef = useRef<HTMLDivElement>(null);
  const [files, setFiles] = useState<{id: string;name: string;size: string;}[]>(editing?.files ?? []);
  const [dragging, setDragging] = useState(false);

  const [name, setName] = useState(editing?.name ?? '');
  const [optional, setOptional] = useState(editing?.optional ?? false);
  const [showInEvents, setShowInEvents] = useState(editing?.showInCandidateEvents ?? false);
  const [description, setDescription] = useState(editing?.description ?? '');
  const [department, setDepartment] = useState<Department | ''>(editing?.department ?? '');
  const [priority, setPriority] = useState<Priority | ''>(editing?.priority ?? '');
  const [dueMode, setDueMode] = useState<DueMode>(rule?.kind ?? 'none');
  const [amount, setAmount] = useState(rule?.kind === 'relative' ? String(rule.amount) : '3');
  const [unit, setUnit] = useState<'days' | 'weeks' | 'months'>(rule?.kind === 'relative' ? rule.unit : 'days');
  const [direction, setDirection] = useState<'before' | 'after'>(
    rule?.kind === 'relative' ? rule.direction : 'after'
  );
  const [relativeMilestone, setRelativeMilestone] = useState<Milestone>(
    rule?.kind === 'relative' ? rule.milestone : 'Hire Date'
  );
  const [namedMilestone, setNamedMilestone] = useState<Milestone>(
    rule?.kind === 'milestone' ? rule.milestone : 'First Working Day'
  );
  const [parentId, setParentId] = useState(editing?.parentId ?? '');
  const [parentRequired, setParentRequired] = useState(editing?.parentCompletionRequired ?? false);
  const [notify, setNotify] = useState<'Yes' | 'No'>(editing?.notifyOnAssignment ?? 'Yes');
  const [ownerOnly, setOwnerOnly] = useState(editing?.ownerOnlyVisible ?? false);
  const [submitted, setSubmitted] = useState(false);
  const [confirmNewTask, setConfirmNewTask] = useState(false);

  // The description editor is uncontrolled, so an edited task's text is placed in it once.
  useEffect(() => {
    if (editing && editorRef.current) editorRef.current.innerText = editing.description;
  }, [editing]);

  const usage = useMemo(
    () => editing ? taskUsage(editing.id, templates, transitions) : null,
    [editing, templates, transitions]
  );

  // A task cannot be its own parent, and a task that has children cannot become a child itself.
  const hasChildren = Boolean(editing && tasks.some((task) => task.parentId === editing.id));
  const parentOptions = useMemo(
    () => tasks.filter((task) => task.kind === kind && !task.parentId && task.id !== editing?.id),
    [tasks, kind, editing]
  );
  const selectedParent = parentOptions.find((task) => task.id === parentId);
  const parentRequiredDisabled = !parentId || Boolean(selectedParent?.optional);

  const words = wordCount(description);
  const nameError = submitted && !name.trim();
  const deptError = submitted && !department;
  const priorityError = submitted && !priority;

  const handleFormat = (command: 'bold' | 'italic' | 'insertUnorderedList') => {
    editorRef.current?.focus();
    document.execCommand(command);
    setDescription(editorRef.current?.innerText ?? '');
  };

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    rememberFiles(Array.from(incoming));
    const mapped = Array.from(incoming).map((file, index) => ({
      id: `${Date.now()}-${index}`,
      name: file.name,
      size: `${Math.max(1, Math.round(file.size / 1024))} KB`
    }));
    setFiles((prev) => [...prev, ...mapped]);
  };

  const listState: TemplatesScreenState = { kind, view: 'tasks' };

  const buildFields = (): Omit<Task, 'id' | 'code' | 'kind'> => ({
      name: name.trim(),
      description: description.trim() || 'No description provided.',
      department: department as Department,
      priority: priority as Priority,
      optional,
      showInCandidateEvents: showInEvents,
      ownerIds: editing?.ownerIds ?? [],
      dueRule:
      dueMode === 'relative' ?
      {
        kind: 'relative',
        amount: Number(amount) || 1,
        unit,
        direction,
        milestone: relativeMilestone
      } :
      dueMode === 'milestone' ?
      { kind: 'milestone', milestone: namedMilestone } :
      null,
      parentId: parentId || null,
      parentCompletionRequired: parentRequiredDisabled ? false : parentRequired,
      notifyOnAssignment: notify,
      ownerOnlyVisible: ownerOnly,
      files
  });

  const valid = () => {
    setSubmitted(true);
    return Boolean(name.trim() && department && priority);
  };

  const createTask = (notice?: string) => {
    const id = `task-${Date.now()}`;
    const code = nextTaskCode(kind);
    addTask({ id, code, kind, ...buildFields() });
    if (notice) {
      navigate(`/onboarding/templates/tasks/${id}`, {
        state: { ...listState, notice: notice.replace('{code}', code) }
      });
    } else {
      navigate('/onboarding/templates', { state: listState });
    }
  };

  const handleCreate = () => {
    if (valid()) createTask();
  };

  const handleSave = () => {
    if (!editing || !valid()) return;
    // A task in use is never changed in place: saving creates a new task instead.
    if (usage?.inUse) {
      setConfirmNewTask(true);
      return;
    }
    updateTask(editing.id, buildFields());
    navigate(`/onboarding/templates/tasks/${editing.id}`, {
      state: { ...listState, notice: `Changes to ${editing.code} were saved.` }
    });
  };

  if (taskId && !editing) {
    return <NoAccess title="Task not found" description="This task may have been deleted from the task library." />;
  }
  if (!hasOboPermission('Manage Task Library')) {
    return (
      <NoAccess
        title="You don't have access to this screen"
        description="Creating and editing tasks requires the Manage Task Library permission." />);


  }
  if (editing?.ownerOnlyVisible && !hasOboPermission('View Restricted Tasks')) {
    return (
      <NoAccess
        title="This task is restricted"
        description="Only users with the View Restricted Tasks permission can open restricted tasks." />);


  }
  const cancelTo = editing ? `/onboarding/templates/tasks/${editing.id}` : '/onboarding/templates';

  return (
    <div>
      <PageHeader
        title={editing ? `Edit Task · ${editing.code}` : 'Create Task'}
        subtitle={
        editing ?
        `Change any detail of this ${kind.toLowerCase()} task.` :
        `This task will be added to the ${kind.toLowerCase()} library.`
        }
        backTo={cancelTo}
        backLabel={editing ? 'Back to task' : 'Back to Templates'} />
      

      <div className="px-8 py-6">
        <div className="max-w-3xl space-y-5 rounded-xl border border-line bg-white p-6 shadow-card">
          {editing && usage?.inUse &&
          <div className="flex items-start gap-2.5 rounded-lg bg-amber-50 px-3.5 py-3 ring-1 ring-inset ring-amber-200">
              <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-[13px] leading-relaxed text-amber-900">
                {taskUsageLabel(usage)}. Saving will create a new task with a new task code; this task stays
                unchanged.
              </p>
            </div>
          }
          <FieldGroup label="Task Name" required>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Asset Handover"
              aria-invalid={nameError}
              className={nameError ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : ''} />
            
            {nameError && <p className="mt-1.5 text-[12px] text-red-600">Task name is required.</p>}
          </FieldGroup>

          <Checkbox
            label="Optional Task"
            description="Owners can close the transition without completing this task."
            checked={optional}
            onChange={(event) => setOptional(event.target.checked)} />
          

          <Checkbox
            label="Show in candidate's events"
            description="The task appears on the candidate's My Events tab in the portal."
            checked={showInEvents}
            onChange={(event) => setShowInEvents(event.target.checked)} />
          

          {showInEvents &&
          <div className="flex items-start gap-2.5 rounded-lg bg-sky-50 px-3.5 py-3 ring-1 ring-inset ring-sky-200">
              <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
              <p className="text-[13px] leading-relaxed text-sky-900">
                The candidate will see this as &ldquo;
                <span className="font-medium">{name.trim() || 'Asset Handover'}</span>&rdquo;
              </p>
            </div>
          }

          <div>
            <Label
              hint={
              <span className={words > 100 ? 'text-[12px] text-red-600' : 'text-[12px] text-subtle'}>
                  {words}/100 words
                </span>
              }>
              
              Task Description
            </Label>
            <div className="overflow-hidden rounded-lg border border-line focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100">
              <div className="flex items-center gap-1 border-b border-line bg-slate-50/70 px-2 py-1.5">
                <ToolbarButton label="Bold" onClick={() => handleFormat('bold')} icon={BoldIcon} />
                <ToolbarButton label="Italic" onClick={() => handleFormat('italic')} icon={ItalicIcon} />
                <ToolbarButton
                  label="Bullet list"
                  onClick={() => handleFormat('insertUnorderedList')}
                  icon={ListIcon} />
                
              </div>
              <div
                ref={editorRef}
                contentEditable
                role="textbox"
                aria-label="Task Description"
                aria-multiline="true"
                data-placeholder="Describe what the owner needs to do."
                onInput={(event) => setDescription((event.target as HTMLDivElement).innerText)}
                className="rte min-h-[110px] px-3 py-2.5 text-sm leading-relaxed text-ink focus:outline-none" />
              
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FieldGroup label="Department" required>
              <Select
                value={department}
                onChange={(event) => setDepartment(event.target.value as Department)}
                aria-invalid={deptError}
                className={deptError ? 'border-red-300' : ''}>
                
                <option value="">Select department</option>
                {departments.map((dept) =>
                <option key={dept} value={dept}>
                    {dept}
                  </option>
                )}
              </Select>
              {deptError && <p className="mt-1.5 text-[12px] text-red-600">Department is required.</p>}
            </FieldGroup>

            <FieldGroup label="Priority" required>
              <Select
                value={priority}
                onChange={(event) => setPriority(event.target.value as Priority)}
                aria-invalid={priorityError}
                className={priorityError ? 'border-red-300' : ''}>
                
                <option value="">Select priority</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </Select>
              {priorityError && <p className="mt-1.5 text-[12px] text-red-600">Priority is required.</p>}
            </FieldGroup>
          </div>

          <fieldset className="rounded-lg border border-line p-4">
            <legend className="px-1 text-[13px] font-medium text-ink">Due Date</legend>
            <p className="mb-3 text-[12px] text-muted">
              Optional. Leave unset and owners will pick a date when the transition starts.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <RadioPill
                label="No due date"
                checked={dueMode === 'none'}
                onChange={() => setDueMode('none')} />
              
              <RadioPill
                label="Relative offset"
                checked={dueMode === 'relative'}
                onChange={() => setDueMode('relative')} />
              
              <RadioPill
                label="Named milestone"
                checked={dueMode === 'milestone'}
                onChange={() => setDueMode('milestone')} />
              
            </div>

            {dueMode === 'relative' &&
            <div className="mt-4 flex flex-wrap items-center gap-2">
                <Input
                type="number"
                min={1}
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                aria-label="Offset amount"
                className="w-20" />
              
                <Select
                value={unit}
                onChange={(event) => setUnit(event.target.value as typeof unit)}
                aria-label="Offset unit"
                className="w-28">
                
                  <option value="days">days</option>
                  <option value="weeks">weeks</option>
                  <option value="months">months</option>
                </Select>
                <Select
                value={direction}
                onChange={(event) => setDirection(event.target.value as typeof direction)}
                aria-label="Offset direction"
                className="w-28">
                
                  <option value="before">before</option>
                  <option value="after">after</option>
                </Select>
                <Select
                value={relativeMilestone}
                onChange={(event) => setRelativeMilestone(event.target.value as Milestone)}
                aria-label="Milestone"
                className="w-52">
                
                  {milestones.map((milestone) =>
                <option key={milestone} value={milestone}>
                      {milestone}
                    </option>
                )}
                </Select>
              </div>
            }

            {dueMode === 'milestone' &&
            <div className="mt-4 max-w-xs">
                <Select
                value={namedMilestone}
                onChange={(event) => setNamedMilestone(event.target.value as Milestone)}
                aria-label="Named milestone">
                
                  {milestones.map((milestone) =>
                <option key={milestone} value={milestone}>
                      {milestone}
                    </option>
                )}
                </Select>
              </div>
            }
          </fieldset>

          <fieldset className="rounded-lg border border-line p-4">
            <legend className="px-1 text-[13px] font-medium text-ink">Task Dependencies</legend>
            <div className="mt-1 max-w-md">
              <FieldGroup label="Parent Task">
                <Select
                  value={parentId}
                  disabled={hasChildren}
                  onChange={(event) => setParentId(event.target.value)}>
                  <option value="">No parent task</option>
                  {parentOptions.map((task) =>
                  <option key={task.id} value={task.id}>
                      {task.code} — {task.name}
                      {task.optional ? ' (Optional)' : ''}
                    </option>
                  )}
                </Select>
              </FieldGroup>
              {hasChildren &&
              <p className="mt-1.5 text-[12px] text-muted">
                  This task has child tasks, so it cannot have a parent task itself.
                </p>
              }
            </div>
            <div className="mt-3">
              <Checkbox
                label="Parent task completion is required"
                description={
                selectedParent?.optional ?
                'Unavailable because the selected parent task is optional.' :
                'This task stays locked until the parent task is completed.'
                }
                checked={parentRequired && !parentRequiredDisabled}
                disabled={parentRequiredDisabled}
                onChange={(event) => setParentRequired(event.target.checked)} />
              
            </div>
          </fieldset>

          <FieldGroup label="Assignment Notifications" required className="max-w-xs">
            <Select value={notify} onChange={(event) => setNotify(event.target.value as 'Yes' | 'No')}>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </Select>
          </FieldGroup>

          <div>
            <Label hint={<span className="text-[12px] text-subtle">25 MB combined limit</span>}>
              Upload Files
            </Label>
            <label
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                addFiles(event.dataTransfer.files);
              }}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-6 py-8 text-center transition-colors duration-150 ease-out ${
              dragging ? 'border-brand-400 bg-brand-50/60' : 'border-line bg-slate-50/60 hover:border-slate-300'}`
              }>
              
              <UploadCloudIcon className="h-5 w-5 text-subtle" />
              <p className="mt-2 text-[13px] text-ink">
                Drag and drop files here, or <span className="text-brand-600">browse</span>
              </p>
              <p className="mt-0.5 text-[12px] text-muted">PDF, PNG, JPG, JPEG or DOCX</p>
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(event) => {
                  addFiles(event.target.files);
                  event.target.value = '';
                }} />
              
            </label>
            {files.length > 0 &&
            <ul className="mt-2 space-y-1.5">
                {files.map((file) =>
              <li
                key={file.id}
                className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-[13px]">
                
                    <FileThumb name={file.name} context={name.trim() || 'New task'} size="sm" />
                    <span className="flex-1 truncate text-ink">{file.name}</span>
                    <span className="text-[12px] text-muted">{file.size}</span>
                    <FilePreviewButton name={file.name} context={name.trim() || 'New task'} />
                    <button
                  type="button"
                  aria-label={`Remove ${file.name}`}
                  onClick={() => setFiles((prev) => prev.filter((f) => f.id !== file.id))}
                  className="rounded p-1 text-subtle transition-colors duration-150 ease-out hover:bg-slate-100 hover:text-ink">
                  
                      <XIcon className="h-3.5 w-3.5" />
                    </button>
                  </li>
              )}
              </ul>
            }
          </div>

          <Checkbox
            label="Visible only to task owner and admins"
            checked={ownerOnly}
            onChange={(event) => setOwnerOnly(event.target.checked)} />
          

          <div className="flex justify-end gap-2 border-t border-line pt-5">
            <Button onClick={() => navigate(cancelTo, { state: listState })}>Cancel</Button>
            {editing ?
            <Button variant="primary" onClick={handleSave}>
                Save Changes
              </Button> :

            <Button variant="primary" onClick={handleCreate}>
                Create Task
              </Button>
            }
          </div>
        </div>
      </div>

      {editing &&
      <Dialog
        open={confirmNewTask}
        title="Save as a new task?"
        body={
        <>
              <p>
                <span className="font-medium text-ink">{editing.name}</span> ({editing.code}) is in use.{' '}
                {usage ? `${taskUsageLabel(usage)}.` : ''}
              </p>
              <p className="mt-2">
                Saving will create a new task with a new task code ({nextTaskCode(kind)}) rather than updating
                the existing one. The original task, and the templates and transitions using it, stay unchanged.
              </p>
            </>
        }
        confirmLabel="Create New Task"
        onCancel={() => setConfirmNewTask(false)}
        onConfirm={() => createTask(`Saved as a new task, {code}. ${editing.code} was left unchanged.`)} />
      }
    </div>);

}

function ToolbarButton({
  label,
  onClick,
  icon: Icon




}: {label: string;onClick: () => void;icon: React.ComponentType<{className?: string;}>;}) {
  return (
    <button
      type="button"
      aria-label={label}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className="inline-flex h-7 w-7 items-center justify-center rounded text-muted transition-colors duration-150 ease-out hover:bg-white hover:text-ink">
      
      <Icon className="h-3.5 w-3.5" />
    </button>);

}

function RadioPill({
  label,
  checked,
  onChange




}: {label: string;checked: boolean;onChange: () => void;}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-[13px] text-ink">
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 border-slate-300 text-brand-500 focus:ring-brand-200" />
      
      {label}
    </label>);

}