import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon, MessageSquareTextIcon, PlusIcon } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Segmented } from '../../components/ui/Segmented';
import { SearchInput } from '../../components/ui/SearchInput';
import { Menu, type MenuItem } from '../../components/ui/Menu';
import { Tooltip } from '../../components/ui/Tooltip';
import { EmptyState } from '../../components/ui/EmptyState';
import { Dialog } from '../../components/ui/Dialog';
import { Toast } from '../../components/ui/Toast';
import { FeedbackStatusBadge } from '../../components/feedback/FeedbackStatusBadge';
import { useAppData } from '../../contexts/AppDataContext';
import { useFeedbackForms } from '../../contexts/FeedbackFormsContext';
import type { FeedbackForm } from '../../types';
import {
  FEEDBACK_FORMS_PATH,
  SENT_DELETE_HINT,
  SENT_EDIT_HINT,
  canManageFeedbackForms,
  hasBeenSent } from
'../../utils/feedbackForms';
import { useScreenInit } from '../../useScreenInit.js';

type StatusFilter = 'All' | FeedbackForm['status'];

const PAGE_SIZE = 10;
const MANAGE_HINT = 'Requires the Manage Exit Feedback Forms permission';

interface ListScreenState {
  status?: StatusFilter;
  query?: string;
  page?: number;
  confirmDelete?: string;
  /** Canvas: show the list as a user with View Exit Feedback Forms only. */
  viewOnly?: boolean;
}

/** Templates → Forms → Exit Feedback: every exit feedback form template. */
export function FeedbackForms() {
  const navigate = useNavigate();
  const location = useLocation();
  const screenInit = useScreenInit() as ListScreenState;
  const arrivedNotice = (location.state as {notice?: string;} | null)?.notice ?? null;
  const { oboPermissions } = useAppData();
  const { feedbackForms, duplicateFeedbackForm, setFeedbackFormStatus, deleteFeedbackForm } = useFeedbackForms();
  const canManage = canManageFeedbackForms(oboPermissions) && !screenInit.viewOnly;

  const [status, setStatus] = useState<StatusFilter>(screenInit.status ?? 'All');
  const [query, setQuery] = useState(screenInit.query ?? '');
  const [page, setPage] = useState(screenInit.page ?? 1);
  const [notice, setNotice] = useState<string | null>(arrivedNotice);
  const [deleting, setDeleting] = useState<FeedbackForm | null>(
    feedbackForms.find((item) => item.id === screenInit.confirmDelete && !hasBeenSent(item)) ?? null
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return feedbackForms.
    filter((item) => status === 'All' || item.status === status).
    filter((item) => !needle || item.name.toLowerCase().includes(needle) || item.code.toLowerCase().includes(needle)).
    sort((a, b) => b.code.localeCompare(a.code));
  }, [feedbackForms, status, query]);

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = visible.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const filtersApplied = Boolean(query.trim()) || status !== 'All';
  const count = (value: FeedbackForm['status']) => feedbackForms.filter((item) => item.status === value).length;

  const open = (item: FeedbackForm) => navigate(`${FEEDBACK_FORMS_PATH}/${item.id}`);

  const actionsFor = (item: FeedbackForm): MenuItem[] => {
    const locked = { disabled: !canManage, hint: canManage ? undefined : MANAGE_HINT };
    // Once sent, a form's questions are fixed so past responses still match them.
    const sentLock = (hint: string) => canManage && hasBeenSent(item) ? { disabled: true, hint } : locked;
    return [
    { label: 'View', onSelect: () => open(item) },
    {
      label: 'Edit',
      onSelect: () => navigate(`${FEEDBACK_FORMS_PATH}/${item.id}/edit`),
      ...sentLock(SENT_EDIT_HINT)
    },
    {
      label: 'Duplicate',
      onSelect: () => {
        const copy = duplicateFeedbackForm(item.id);
        if (copy) setNotice(`${item.code} was duplicated as ${copy.code}.`);
      },
      ...locked
    },
    {
      label: item.status === 'Active' ? 'Mark as Inactive' : 'Mark as Active',
      onSelect: () => {
        const next = item.status === 'Active' ? 'Inactive' : 'Active';
        setFeedbackFormStatus(item.id, next);
        setNotice(
          next === 'Inactive' ?
          `${item.code} is inactive and can no longer be sent.${
          item.responseCount > 0 ?
          ` Its ${item.responseCount} ${item.responseCount === 1 ? 'response is' : 'responses are'} kept.` :
          ''}` :
          `${item.code} is active and can be sent again.`
        );
      },
      ...locked
    },
    { label: 'Delete', danger: true, onSelect: () => setDeleting(item), ...sentLock(SENT_DELETE_HINT) }];

  };

  const resetPage = () => setPage(1);

  return (
    <div>
      <PageHeader
        title="Exit Feedback Forms"
        subtitle="Question sets for collecting feedback from leavers. Everyone who receives a form answers the same questions."
        actions={
        canManage ?
        <Button variant="primary" onClick={() => navigate(`${FEEDBACK_FORMS_PATH}/new`)}>
              <PlusIcon className="h-4 w-4" />
              New Form
            </Button> :

        <Tooltip label={MANAGE_HINT}>
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
            { value: 'All', label: 'All', count: feedbackForms.length },
            { value: 'Active', label: 'Active', count: count('Active') },
            { value: 'Inactive', label: 'Inactive', count: count('Inactive') }]
            }
            value={status}
            onChange={(next) => {
              setStatus(next);
              resetPage();
            }} />

          <div className="flex items-center gap-3">
            <p className="text-[12px] text-muted" aria-live="polite">
              {visible.length} form{visible.length === 1 ? '' : 's'}
            </p>
            <SearchInput
              value={query}
              onChange={(next) => {
                setQuery(next);
                resetPage();
              }}
              placeholder="Search by form name or code"
              className="w-72" />

          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-xl border border-line bg-white shadow-card">
          <div className="grid grid-cols-12 gap-4 border-b border-line bg-slate-50/70 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-subtle">
            <span className="col-span-2">Form code</span>
            <span className="col-span-6">Form name</span>
            <span className="col-span-1 text-right">Questions</span>
            <span className="col-span-2 text-right">Status</span>
            <span className="col-span-1 text-right">Actions</span>
          </div>

          {pageItems.length === 0 ?
          <div className="p-6">
              <EmptyState
              icon={MessageSquareTextIcon}
              title={filtersApplied ? 'No forms match' : 'No exit feedback forms yet'}
              description={
              filtersApplied ?
              'No forms match the current search and status. Try another search or clear the filters.' :
              'Create a form to set the questions leavers are asked.'
              } />

              {filtersApplied &&
            <div className="mt-3 flex justify-center">
                  <Button
                size="sm"
                onClick={() => {
                  setQuery('');
                  setStatus('All');
                  resetPage();
                }}>

                    Clear filters
                  </Button>
                </div>
            }
            </div> :

          <ul className="divide-y divide-line">
              {pageItems.map((item) =>
            <li
              key={item.id}
              onClick={() => open(item)}
              className="grid cursor-pointer grid-cols-12 items-center gap-4 px-5 py-3.5 transition-colors duration-150 ease-out hover:bg-slate-50/60">

                  <span className="col-span-2 font-mono text-[12px] text-subtle">{item.code}</span>
                  <span className="col-span-6 min-w-0">
                    <span className="block truncate text-[13px] font-medium text-ink">{item.name}</span>
                    {item.description &&
                <span className="mt-0.5 block truncate text-[12px] text-muted">{item.description}</span>
                }
                  </span>
                  <span className="col-span-1 text-right text-[13px] text-ink">{item.questions.length}</span>
                  <span className="col-span-2 text-right">
                    <FeedbackStatusBadge status={item.status} />
                  </span>
                  <span className="col-span-1 flex justify-end" onClick={(event) => event.stopPropagation()}>
                    <Menu label={`Actions for ${item.code}`} items={actionsFor(item)} />
                  </span>
                </li>
            )}
            </ul>
          }
        </div>

        {visible.length > PAGE_SIZE &&
        <nav aria-label="Pagination" className="mt-4 flex items-center justify-between">
            <p className="text-[12px] text-muted">
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, visible.length)} of{' '}
              {visible.length}
            </p>
            <div className="flex items-center gap-1">
              <Button
              size="sm"
              variant="ghost"
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
              aria-label="Previous page">

                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) =>
            <Button
              key={number}
              size="sm"
              variant={number === currentPage ? 'primary' : 'ghost'}
              aria-current={number === currentPage ? 'page' : undefined}
              onClick={() => setPage(number)}
              className="w-8 px-0">

                  {number}
                </Button>
            )}
              <Button
              size="sm"
              variant="ghost"
              disabled={currentPage === pageCount}
              onClick={() => setPage(currentPage + 1)}
              aria-label="Next page">

                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </nav>
        }
      </div>

      <Dialog
        open={Boolean(deleting)}
        title={`Delete ${deleting?.name ?? 'this form'}?`}
        body={
        <>
            <span className="font-medium text-ink">
              {deleting?.name} ({deleting?.code})
            </span>{' '}
            has never been sent. Deleting it removes it from the list for good. This cannot be undone.
          </>
        }
        confirmLabel="Delete form"
        confirmVariant="danger"
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          deleteFeedbackForm(deleting.id);
          setNotice(`${deleting.name} (${deleting.code}) was deleted.`);
          setDeleting(null);
        }} />


      <Toast message={notice} onClose={() => setNotice(null)} />
    </div>);

}
