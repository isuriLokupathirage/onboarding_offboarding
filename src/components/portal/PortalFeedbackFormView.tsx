import { useState } from 'react';
import { AlertCircleIcon, ArrowLeftIcon, CheckCircle2Icon, LockIcon } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import type { FeedbackForm } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import { AnswerInput } from '../feedback/FeedbackFormPreview';
import type { PortalFormItem } from '../../utils/portal';
import { formatDate, formatDateTime } from '../../utils/format';

/**
 * An exit feedback form opened from My Forms. It behaves like an employee form in the portal: answers
 * can be saved as a draft, required questions must be answered before submitting, and a submitted form
 * is shown read-only.
 */
export function PortalFeedbackFormView({
  form,
  item,
  initialAnswers,
  draftSavedAt,
  onSaveDraft,
  onSubmit,
  onBack
}: {
  form: FeedbackForm;
  item: PortalFormItem;
  initialAnswers: Record<string, string>;
  draftSavedAt?: string | null;
  onSaveDraft: (answers: Record<string, string>) => void;
  onSubmit: (answers: Record<string, string>) => void;
  onBack: () => void;
}) {
  const readOnly = item.status === 'Submitted';
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [savedAt, setSavedAt] = useState<string | null>(draftSavedAt ?? null);
  const [missing, setMissing] = useState<string[]>([]);
  const [confirming, setConfirming] = useState(false);

  const answered = (id: string) => Boolean(answers[id]?.trim());

  const handleSubmit = () => {
    const gaps = form.questions.filter((question) => question.required && !answered(question.id)).map((q) => q.id);
    setMissing(gaps);
    if (gaps.length === 0) setConfirming(true);
  };

  const handleSaveDraft = () => {
    onSaveDraft(answers);
    setSavedAt(new Date().toISOString());
  };

  const handleConfirm = () => {
    setConfirming(false);
    onSubmit(Object.fromEntries(Object.entries(answers).filter(([, value]) => value.trim() !== '')));
  };

  return (
    <section>
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[13px] text-muted transition-colors duration-150 ease-out hover:bg-slate-100 hover:text-ink">

        <ArrowLeftIcon className="h-3.5 w-3.5" />
        All forms
      </button>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">Exit feedback</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-ink">{item.formName}</h2>
          <p className="mt-1.5 text-[13px] text-muted">
            Sent {formatDate(item.sentAt)} ·{' '}
            {readOnly ? `Submitted ${formatDateTime(item.submittedAt)}` : `Complete by ${formatDate(item.expiresAt)}`}
          </p>
          {form.description && <p className="mt-2 max-w-2xl text-[13px] text-muted">{form.description}</p>}
        </div>
        <Badge
          className={
          readOnly ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-amber-50 text-amber-700 ring-amber-200'
          }>

          {item.status}
        </Badge>
      </div>

      {readOnly &&
      <div className="mt-5 flex items-start gap-2.5 rounded-lg bg-emerald-50 px-4 py-3 text-[13px] text-emerald-900 ring-1 ring-inset ring-emerald-200">
          <LockIcon className="mt-0.5 h-4 w-4 shrink-0" />
          You submitted this form on {formatDateTime(item.submittedAt)}. It has been sent to HR and can no longer
          be edited.
        </div>
      }

      {!readOnly && savedAt &&
      <div
        role="status"
        className="mt-5 flex items-start gap-2.5 rounded-lg bg-sky-50 px-4 py-3 text-[13px] text-sky-900 ring-1 ring-inset ring-sky-200">

          <CheckCircle2Icon className="mt-0.5 h-4 w-4 shrink-0" />
          Draft saved {formatDateTime(savedAt)}. Nothing is sent to HR until you submit. The form still closes on{' '}
          {formatDate(item.expiresAt)}.
        </div>
      }

      {missing.length > 0 &&
      <div
        role="alert"
        className="mt-5 flex items-start gap-2.5 rounded-lg bg-red-50 px-4 py-3 text-[13px] text-red-900 ring-1 ring-inset ring-red-200">

          <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="font-medium">
            Answer the {missing.length === 1 ? 'required question' : `${missing.length} required questions`} before
            submitting
          </p>
        </div>
      }

      {!readOnly &&
      <p className="mt-6 text-[13px] text-muted">
          Questions marked <span className="text-red-500">*</span> are required.
        </p>
      }

      <ol className="mt-4 space-y-3">
        {form.questions.map((question, index) => {
          const isMissing = missing.includes(question.id) && !answered(question.id);
          return (
            <li
              key={question.id}
              className={twMerge('rounded-xl border bg-white p-5', isMissing ? 'border-red-300' : 'border-line')}>

              <p className="text-[14px] font-medium text-ink">
                <span className="mr-1.5 text-subtle">{index + 1}.</span>
                {question.label}
                {question.required && <span className="ml-0.5 text-red-500">*</span>}
              </p>
              {question.description && <p className="mt-1 text-[12px] text-muted">{question.description}</p>}
              <div className="mt-3">
                {readOnly ?
                <p className="whitespace-pre-line text-[13px] text-ink">{answers[question.id] || '—'}</p> :

                <AnswerInput
                  question={question}
                  value={answers[question.id] ?? ''}
                  onChange={(value) => setAnswers((prev) => ({ ...prev, [question.id]: value }))} />

                }
              </div>
              {isMissing && <p className="mt-2 text-[12px] text-red-600">This question is required.</p>}
            </li>);

        })}
      </ol>

      {!readOnly &&
      <div className="mt-8 flex justify-end gap-2 border-t border-line pt-5">
          <Button onClick={handleSaveDraft}>Save as Draft</Button>
          <Button variant="primary" onClick={handleSubmit}>
            Submit
          </Button>
        </div>
      }

      <Dialog
        open={confirming}
        title={`Submit ${item.formName}?`}
        body="Your answers will be sent to HR and cannot be edited afterwards."
        confirmLabel="Submit"
        onCancel={() => setConfirming(false)}
        onConfirm={handleConfirm} />

    </section>);

}
