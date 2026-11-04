import { useState, type ReactNode } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon, CopyIcon, LockIcon, PencilIcon, SendIcon, TextIcon } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Segmented } from '../../components/ui/Segmented';
import { Tooltip } from '../../components/ui/Tooltip';
import { Toast } from '../../components/ui/Toast';
import { FeedbackFormPreview } from '../../components/feedback/FeedbackFormPreview';
import { FeedbackStatusBadge } from '../../components/feedback/FeedbackStatusBadge';
import { useAppData } from '../../contexts/AppDataContext';
import { useFeedbackForms } from '../../contexts/FeedbackFormsContext';
import type { FeedbackForm } from '../../types';
import { formatDate } from '../../utils/format';
import { FEEDBACK_FORMS_PATH, canManageFeedbackForms, hasBeenSent } from '../../utils/feedbackForms';
import { useScreenInit } from '../../useScreenInit.js';

type Tab = 'details' | 'questions';

/**
 * Templates → Forms → Exit Feedback → [Form]: the form read only, laid out like the Employee form
 * page in Accxis360 (Form Details and Questions tabs, Form Preview beside them).
 */
export function FeedbackFormDetail() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const screenInit = useScreenInit() as {preview?: boolean;viewOnly?: boolean;tab?: Tab;};
  const { oboPermissions } = useAppData();
  const { feedbackForms, duplicateFeedbackForm } = useFeedbackForms();
  const form = feedbackForms.find((item) => item.id === formId);
  const [tab, setTab] = useState<Tab>(screenInit.tab === 'questions' ? 'questions' : 'details');
  const [previewing, setPreviewing] = useState(Boolean(screenInit.preview));
  const [notice, setNotice] = useState<string | null>(
    (location.state as {notice?: string;} | null)?.notice ?? null
  );

  if (!form) return <Navigate to={FEEDBACK_FORMS_PATH} replace />;
  const canManage = canManageFeedbackForms(oboPermissions) && !screenInit.viewOnly;
  const sent = hasBeenSent(form);
  const duplicate = () => {
    const copy = duplicateFeedbackForm(form.id);
    if (copy) navigate(`${FEEDBACK_FORMS_PATH}/${copy.id}/edit`);
  };

  return (
    <div>
      <PageHeader
        title={form.name}
        breadcrumb={[
        { label: 'Templates' },
        { label: 'Forms' },
        { label: 'Exit Feedback', to: FEEDBACK_FORMS_PATH },
        { label: form.code }]
        } />


      <div className="px-8 py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <Link
              to={FEEDBACK_FORMS_PATH}
              aria-label="Back to Exit Feedback"
              className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-ink transition-colors duration-150 ease-out hover:bg-slate-50">

              <ArrowLeftIcon className="h-4 w-4" />
            </Link>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-semibold tracking-tight text-ink">{form.name}</h2>
                <FeedbackStatusBadge status={form.status} />
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[13px] text-muted">
                <span>{form.code}</span>
                <span className="text-subtle" aria-hidden="true">
                  •
                </span>
                {sent ?
                <Badge className="bg-sky-50 text-sky-700 ring-sky-200">
                    <SendIcon className="h-3 w-3" />
                    Sent {form.sentCount} time{form.sentCount === 1 ? '' : 's'} · {form.responseCount} response
                    {form.responseCount === 1 ? '' : 's'}
                  </Badge> :

                <span>Never sent</span>
                }
              </div>
            </div>
          </div>

          <FormActions canManage={canManage} sent={sent} formId={form.id} onDuplicate={duplicate} />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <Segmented
            options={[
            { value: 'details', label: 'Form Details' },
            { value: 'questions', label: 'Questions', count: form.questions.length }]
            }
            value={tab}
            onChange={setTab} />

          <Button onClick={() => setPreviewing(true)}>
            <TextIcon className="h-4 w-4" />
            Form Preview
          </Button>
        </div>

        {sent &&
        <div className="mt-4 flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-3.5 text-[13px] ring-1 ring-inset ring-slate-200">
            <LockIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
            <p className="text-muted">
              <span className="font-medium text-ink">This form has been sent, so it can no longer be edited or deleted.</span>{' '}
              Duplicate it to make a version you can change.{' '}
              {form.status === 'Active' ?
            'To stop it being sent, mark it as inactive from the list. Its responses are kept.' :
            'It is inactive and cannot be sent. Its responses are kept.'}
            </p>
          </div>
        }

        <div className="mt-4">
          {tab === 'details' ? <DetailsCard form={form} /> : <QuestionsCard form={form} />}
        </div>
      </div>

      <FeedbackFormPreview
        open={previewing}
        name={form.name}
        description={form.description}
        questions={form.questions}
        onClose={() => setPreviewing(false)} />

      <Toast message={notice} onClose={() => setNotice(null)} />
    </div>);

}

function FormActions({
  canManage,
  sent,
  formId,
  onDuplicate





}: {canManage: boolean;sent: boolean;formId: string;onDuplicate: () => void;}) {
  const navigate = useNavigate();
  if (!canManage) {
    return (
      <Tooltip label="Requires the Manage Exit Feedback Forms permission">
        <span>
          <Button variant="primary" disabled>
            <PencilIcon className="h-4 w-4" />
            Edit Form
          </Button>
        </span>
      </Tooltip>);

  }
  if (sent) {
    return (
      <Button variant="primary" onClick={onDuplicate}>
        <CopyIcon className="h-4 w-4" />
        Duplicate to Change
      </Button>);

  }
  return (
    <Button variant="primary" onClick={() => navigate(`${FEEDBACK_FORMS_PATH}/${formId}/edit`)}>
      <PencilIcon className="h-4 w-4" />
      Edit Form
    </Button>);

}

function DetailsCard({ form }: {form: FeedbackForm;}) {
  return (
    <section className="overflow-hidden rounded-xl border border-line bg-white">
      <div className="space-y-5 p-6">
        <div>
          <Caption>Form name</Caption>
          <p className="mt-1 text-[15px] font-semibold text-ink">{form.name}</p>
        </div>
        <div>
          <Caption>Description</Caption>
          {form.description ?
          <p className="mt-1 whitespace-pre-line text-[14px] text-ink">{form.description}</p> :

          <p className="mt-1 text-[14px] italic text-subtle">No description</p>
          }
        </div>
      </div>
      <dl className="grid grid-cols-1 divide-y divide-line border-t border-line bg-slate-50/60 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-5 lg:divide-x">
        <Cell label="Form code">
          <span className="text-[13px] text-ink">{form.code}</span>
        </Cell>
        <Cell label="Status">
          <FeedbackStatusBadge status={form.status} />
        </Cell>
        <Cell label="Available for sending">
          <span className="text-[14px] text-ink">{form.status === 'Active' ? 'Yes' : 'No, inactive'}</span>
        </Cell>
        <Cell label="Created by">
          <span className="text-[14px] text-ink">{form.createdBy}</span>
        </Cell>
        <Cell label="Created date">
          <span className="text-[14px] text-ink">{formatDate(form.createdAt)}</span>
        </Cell>
      </dl>
    </section>);

}

function QuestionsCard({ form }: {form: FeedbackForm;}) {
  const required = form.questions.filter((question) => question.required).length;
  return (
    <section className="overflow-hidden rounded-xl border border-line bg-white">
      <p className="border-b border-line px-6 py-3.5 text-[13px] text-muted">
        {form.questions.length} question{form.questions.length === 1 ? '' : 's'} · {required} required. Asked in this
        order.
      </p>
      <ol className="divide-y divide-line">
        {form.questions.map((question, index) =>
        <li key={question.id} className="flex gap-3 px-6 py-4">
            <span className="w-5 shrink-0 text-right text-[12px] font-medium text-subtle">{index + 1}.</span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-medium text-ink">{question.label}</p>
              {question.description && <p className="mt-0.5 text-[12px] text-muted">{question.description}</p>}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge>{question.answerType === 'Rating Scale' ? 'Rating Scale (1–5)' : question.answerType}</Badge>
                {question.required ?
              <Badge className="bg-red-50 text-red-700 ring-red-200">Required</Badge> :
              <Badge className="bg-slate-50 text-slate-500 ring-slate-200">Optional</Badge>
              }
              </div>
            </div>
          </li>
        )}
      </ol>
    </section>);

}

function Caption({ children }: {children: ReactNode;}) {
  return <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle">{children}</p>;
}

function Cell({ label, children }: {label: string;children: ReactNode;}) {
  return (
    <div className="border-line px-6 py-4">
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-subtle">{label}</dt>
      <dd className="mt-2">{children}</dd>
    </div>);

}
