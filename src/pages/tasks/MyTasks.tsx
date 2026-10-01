import React, { useCallback, useMemo, useState } from 'react';
import { Building2Icon, BriefcaseIcon, CalendarIcon, ClipboardCheckIcon, FileTextIcon, UserIcon } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Segmented } from '../../components/ui/Segmented';
import { EmptyState } from '../../components/ui/EmptyState';
import { OboTaskCard } from '../../components/tasks/OboTaskCard';
import { TaskDetailPanel } from '../../components/tasks/TaskDetailPanel';
import { useAppData } from '../../contexts/AppDataContext';
import {
  jdApprovals,
  recruitmentTasks,
  requisitionApprovals,
  type JdApprovalItem,
  type RecruitmentTaskItem,
  type RequisitionApprovalItem } from
'../../data/myTasks';
import type { Transition, TransitionTask, TransitionTaskStatus } from '../../types';
import { formatDate } from '../../utils/format';
import { isTaskOpen, statusGroup } from '../../utils/transitions';
import { useScreenInit } from '../../useScreenInit.js';

type Tab = 'all' | 'recruitment' | 'jd' | 'requisition' | 'obo';

interface OboItem {
  kind: 'obo';
  transition: Transition;
  task: TransitionTask;
}

type MyTaskItem = RecruitmentTaskItem | JdApprovalItem | RequisitionApprovalItem | OboItem;

interface OpenTaskRef {
  transitionId: string;
  taskId: string;
}

function parseOpenTask(value: unknown): OpenTaskRef | null {
  if (typeof value !== 'string') return null;
  const [transitionId, taskId] = value.split(':');
  return transitionId && taskId ? { transitionId, taskId } : null;
}

export function MyTasks() {
  const init = useScreenInit() as {tab?: Tab;openTask?: string;};
  const { transitions, currentUserId, hasOboPermission, updateTaskStatus } = useAppData();
  const canSeeOboTasks = hasOboPermission('Update Task Progress');
  const canSeeRestricted = hasOboPermission('View Restricted Tasks');

  const [tab, setTab] = useState<Tab>(init.tab === 'obo' && !canSeeOboTasks ? 'all' : init.tab ?? 'all');
  const [openTask, setOpenTask] = useState<OpenTaskRef | null>(
    canSeeOboTasks ? parseOpenTask(init.openTask) : null
  );
  const [notice, setNotice] = useState<string | null>(null);

  const oboItems = useMemo<OboItem[]>(() => {
    if (!canSeeOboTasks) return [];
    return transitions.
    filter((transition) => statusGroup(transition) === 'Active').
    flatMap((transition) =>
    transition.tasks.
    filter(
      (task) =>
      task.ownerIds.includes(currentUserId) &&
      isTaskOpen(task) && (
      !task.restricted || canSeeRestricted)
    ).
    map((task) => ({ kind: 'obo' as const, transition, task }))
    ).
    sort((a, b) => (a.task.dueDate ?? '9999').localeCompare(b.task.dueDate ?? '9999'));
  }, [transitions, currentUserId, canSeeOboTasks, canSeeRestricted]);

  const itemsByTab: Record<Tab, MyTaskItem[]> = {
    all: [...jdApprovals, ...requisitionApprovals, ...recruitmentTasks, ...oboItems],
    recruitment: recruitmentTasks,
    jd: jdApprovals,
    requisition: requisitionApprovals,
    obo: oboItems
  };

  const tabs: {value: Tab;label: string;count: number;}[] = [
  { value: 'all', label: 'All Tasks', count: itemsByTab.all.length },
  { value: 'recruitment', label: 'Recruitment Tasks', count: recruitmentTasks.length },
  { value: 'jd', label: 'JD Approvals', count: jdApprovals.length },
  { value: 'requisition', label: 'Requisition Approvals', count: requisitionApprovals.length }];

  if (canSeeOboTasks) {
    tabs.push({ value: 'obo', label: 'Onboarding & Offboarding', count: oboItems.length });
  }

  const openItem = openTask ?
  oboItems.find(
    (item) => item.transition.id === openTask.transitionId && item.task.id === openTask.taskId
  ) :
  undefined;

  const closePanel = useCallback(() => setOpenTask(null), []);

  const saveStatus = (status: TransitionTaskStatus) => {
    if (!openItem) return;
    updateTaskStatus(openItem.transition.id, openItem.task.id, status);
    setNotice(
      isTaskOpen({ ...openItem.task, status }) ?
      `${openItem.task.name} is now ${status.toLowerCase()}.` :
      `${openItem.task.name} was marked ${status.toLowerCase()} and removed from My Tasks.`
    );
    setOpenTask(null);
  };

  const visible = itemsByTab[tab];

  return (
    <div>
      <PageHeader
        title="My Tasks"
        subtitle={
        canSeeOboTasks ?
        'Manage your assigned recruitment tasks, job description approvals, requisition approvals and onboarding & offboarding tasks.' :
        'Manage your assigned recruitment tasks, job description approvals and requisition approvals.'
        } />


      <div className="px-8 py-6">
        {notice &&
        <div className="mb-4 rounded-lg bg-emerald-50 px-3.5 py-3 text-[13px] text-emerald-900 ring-1 ring-inset ring-emerald-200">
            {notice}
          </div>
        }

        <Segmented options={tabs} value={tab} onChange={setTab} />

        {visible.length === 0 ?
        <div className="mt-5">
            <EmptyState
            icon={ClipboardCheckIcon}
            title="You're all caught up"
            description={
            tab === 'obo' ?
            'No onboarding or offboarding tasks are assigned to you right now.' :
            'There are no tasks waiting on you in this view.'
            } />

          </div> :

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {visible.map((item) => {
            if (item.kind === 'obo') {
              return (
                <OboTaskCard
                  key={`${item.transition.id}:${item.task.id}`}
                  transition={item.transition}
                  task={item.task}
                  onOpen={() => {
                    setNotice(null);
                    setOpenTask({ transitionId: item.transition.id, taskId: item.task.id });
                  }} />);


            }
            if (item.kind === 'jd') return <JdCard key={item.id} item={item} />;
            if (item.kind === 'requisition') return <RequisitionCard key={item.id} item={item} />;
            return <RecruitmentCard key={item.id} item={item} />;
          })}
          </div>
        }
      </div>

      <TaskDetailPanel
        transition={openItem?.transition}
        task={openItem?.task}
        onClose={closePanel}
        onSave={saveStatus} />

    </div>);

}

function CardShell({
  tag,
  tagClass,
  badge,
  children,
  action




}: {tag: string;tagClass: string;badge: React.ReactNode;children: React.ReactNode;action: string;}) {
  return (
    <article className="flex flex-col rounded-xl border border-line bg-white p-5 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <span
          className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset ${tagClass}`}>

          {tag}
        </span>
        {badge}
      </div>
      {children}
      <div className="mt-auto pt-4">
        <Button className="w-full">{action}</Button>
      </div>
    </article>);

}

function JdCard({ item }: {item: JdApprovalItem;}) {
  return (
    <CardShell
      tag="JD Approval"
      tagClass="bg-amber-50 text-amber-700 ring-amber-200"
      badge={<span className="rounded-md bg-amber-50 px-2 py-0.5 text-[12px] font-medium text-amber-700">Pending Approval</span>}
      action="Approve JD">

      <h3 className="mt-3 truncate text-[15px] font-semibold text-ink">{item.title}</h3>
      <p className="text-[12px] text-muted">
        {item.code} <span className="ml-1 rounded bg-slate-100 px-1 font-medium text-ink">{item.version}</span>
      </p>
      <ul className="mt-3 space-y-2 text-[13px] text-ink">
        <li className="flex items-center gap-2">
          <Building2Icon className="h-3.5 w-3.5 text-subtle" />
          <span className="truncate">{item.company}</span>
        </li>
        <li className="flex items-center gap-2">
          <BriefcaseIcon className="h-3.5 w-3.5 text-subtle" />
          {item.department} · {item.employmentType}
        </li>
        <li className="flex items-center gap-2">
          <UserIcon className="h-3.5 w-3.5 text-subtle" />
          Submitted by {item.submittedBy}
        </li>
      </ul>
      <p className="mt-3 border-t border-line pt-3 text-[12px] text-muted">Submitted on {item.submittedOn}</p>
    </CardShell>);

}

function RequisitionCard({ item }: {item: RequisitionApprovalItem;}) {
  return (
    <CardShell
      tag="Requisition"
      tagClass="bg-indigo-50 text-indigo-700 ring-indigo-200"
      badge={<span className="rounded-md px-2 py-0.5 text-[12px] font-medium text-ink ring-1 ring-line">{item.priority}</span>}
      action="Review & decide">

      <h3 className="mt-3 truncate text-[15px] font-semibold text-ink">{item.title}</h3>
      <p className="truncate text-[12px] text-muted">
        {item.department} · by {item.requester}
      </p>
      <div className="mt-3 border-t border-line pt-3 text-[13px]">
        <p className="flex items-center gap-2 text-[12px] text-muted">
          <FileTextIcon className="h-3.5 w-3.5 text-subtle" />
          {item.code} · {item.workflow}
        </p>
        <p className="mt-2 text-amber-700">{item.step}</p>
        <p className="mt-2 text-muted">
          Submitted <span className="font-medium text-ink">{item.submittedOn}</span>
        </p>
      </div>
    </CardShell>);

}

function RecruitmentCard({ item }: {item: RecruitmentTaskItem;}) {
  return (
    <CardShell
      tag="Recruitment"
      tagClass="bg-sky-50 text-sky-700 ring-sky-200"
      badge={<span className="rounded-md bg-sky-50 px-2 py-0.5 text-[12px] font-medium text-sky-700">{item.status}</span>}
      action="Open Task">

      <h3 className="mt-3 truncate text-[15px] font-semibold text-ink">{item.candidate}</h3>
      <p className="text-[12px] text-muted">{item.role}</p>
      <div className="mt-3 space-y-2 border-t border-line pt-3 text-[13px]">
        <p className="text-amber-700">
          {item.stage} <span className="ml-1 text-[12px] text-muted">· {item.stageType}</span>
        </p>
        <p className="flex items-center gap-2 text-ink">
          <CalendarIcon className="h-3.5 w-3.5 text-subtle" />
          {formatDate(item.date)} · {item.time}
        </p>
      </div>
    </CardShell>);

}
