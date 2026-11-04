import { useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { EyeIcon, PencilIcon } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Tooltip } from '../../components/ui/Tooltip';
import { Toast } from '../../components/ui/Toast';
import { FeedbackFormPreview } from '../../components/feedback/FeedbackFormPreview';
import { FeedbackStatusBadge } from '../../components/feedback/FeedbackStatusBadge';
import { useAppData } from '../../contexts/AppDataContext';
import { useFeedbackForms } from '../../contexts/FeedbackFormsContext';
import { formatDateTime } from '../../utils/format';
import { FEEDBACK_FORMS_PATH, canManageFeedbackForms } from '../../utils/feedbackForms';
import { useScreenInit } from '../../useScreenInit.js';

/** Templates → Forms → Exit Feedback → [Form]: the form's details and questions, read only. */
export function FeedbackFormDetail() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const screenInit = useScreenInit() as {preview?: boolean;viewOnly?: boolean;};
  const { oboPermissions } = useAppData();
  const { feedbackForms } = useFeedbackForms();
  const form = feedbackForms.find((item) => item.id === formId);
  const [previewing, setPreviewing] = useState(Boolean(screenInit.preview));
  const [notice, setNotice] = useState<string | null>(
    (location.state as {notice?: string;} | null)?.notice ?? null
  );

  if (!form) return <Navigate to={FEEDBACK_FORMS_PATH} replace />;
  const canManage = canManageFeedbackForms(oboPermissions) && !screenInit.viewOnly;
  const required = form.questions.filter((question) => question.required).length;

  return (
    <div>
      <PageHeader
        title={form.name}
        backTo={FEEDBACK_FORMS_PATH}
        backLabel="Back to Exit Feedback"
        meta={
        <div className="mt-2 flex flex-wrap items-center gap-3 text-[13px]">
            <span className="font-mono text-[12px] text-subtle">{form.code}</span>
            <FeedbackStatusBadge status={form.status} />
            <span className="text-muted">
              {form.questions.length} question{form.questions.length === 1 ? '' : 's'} · {required} required
            </span>
          </div>
        }
        actions={
        <>
            <Button onClick={() => setPreviewing(true)}>
              <EyeIcon className="h-4 w-4" />
              Preview
            </Button>
            {canManage ?
          <Button variant="primary" onClick={() => navigate(`${FEEDBACK_FORMS_PATH}/${form.id}/edit`)}>
                <PencilIcon className="h-4 w-4" />
                Edit
              </Button> :

          <Tooltip label="Requires the Manage Exit Feedback Forms permission">
                <span>
                  <Button variant="primary" disabled>
                    <PencilIcon className="h-4 w-4" />
                    Edit
                  </Button>
                </span>
              </Tooltip>
          }
          </>
        } />


      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 px-8 py-6 lg:grid-cols-3">
        <section className="overflow-hidden rounded-xl border border-line bg-white lg:col-span-2">
          <h2 className="border-b border-line px-5 py-3.5 text-[14px] font-semibold text-ink">Questions</h2>
          <ol className="divide-y divide-line">
            {form.questions.map((question, index) =>
            <li key={question.id} className="flex gap-3 px-5 py-3.5">
                <span className="w-5 shrink-0 text-right text-[12px] font-medium text-subtle">{index + 1}.</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-ink">{question.label}</p>
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
        </section>

        <aside className="h-fit rounded-xl border border-line bg-white p-5">
          <h2 className="text-[13px] font-semibold text-ink">Form details</h2>
          <dl className="mt-3 space-y-3 text-[13px]">
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-subtle">Description</dt>
              <dd className="mt-0.5 whitespace-pre-line text-ink">{form.description || '—'}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-subtle">Created</dt>
              <dd className="mt-0.5 text-ink">
                {form.createdBy} · {formatDateTime(form.createdAt)}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-subtle">Last updated</dt>
              <dd className="mt-0.5 text-ink">{formatDateTime(form.updatedAt)}</dd>
            </div>
          </dl>
        </aside>
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
