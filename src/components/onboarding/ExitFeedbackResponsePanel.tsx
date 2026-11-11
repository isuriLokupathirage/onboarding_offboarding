import { XIcon } from 'lucide-react';
import { Drawer } from '../ui/Drawer';
import type { EmailRecord, FeedbackForm, FeedbackQuestion, FormSubmission } from '../../types';
import { formatDate, formatDateTime } from '../../utils/format';
import { RATING_SCALE } from '../../utils/feedbackForms';

function answerText(question: FeedbackQuestion, answer: string | undefined): string {
  if (!answer?.trim()) return 'Not answered';
  if (question.answerType === 'Rating Scale') return `${answer} out of ${RATING_SCALE.length}`;
  return answer;
}

/**
 * Transitions → [Offboarding Transition] → Sent Forms → a submitted exit feedback form: the leaver's
 * answers, question by question, in the order the form asks them.
 */
export function ExitFeedbackResponsePanel({
  open,
  employeeName,
  form,
  email,
  submission,
  onClose
}: {
  open: boolean;
  employeeName: string;
  form: FeedbackForm | undefined;
  email: EmailRecord | undefined;
  submission: FormSubmission | undefined;
  onClose: () => void;
}) {
  const responses = submission?.responses ?? {};
  const questions = form?.questions ?? [];
  const answered = questions.filter((question) => responses[question.id]?.trim()).length;

  return (
    <Drawer open={open && Boolean(submission)} label={`Exit feedback from ${employeeName}`} onClose={onClose}>
      {submission && email &&
      <>
          <div className="flex items-start justify-between gap-3 border-b border-line px-6 py-5">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">Exit feedback</p>
              <h2 className="mt-1 text-base font-semibold text-ink">{email.formName ?? form?.name}</h2>
              <p className="mt-1 text-[13px] text-muted">
                <span className="font-mono text-[12px] text-subtle">{email.formCode}</span> · submitted by{' '}
                {employeeName} on {formatDateTime(submission.submittedAt)}
              </p>
              <p className="mt-0.5 text-[12px] text-muted">
                Sent {formatDate(email.sentAt)} to {email.recipient} · {answered} of {questions.length} questions
                answered
              </p>
            </div>
            <button
            type="button"
            onClick={onClose}
            aria-label="Close response"
            className="rounded-lg p-1.5 text-subtle transition-colors duration-150 ease-out hover:bg-slate-100 hover:text-ink">

              <XIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="scroll-thin flex-1 overflow-y-auto px-6 py-5">
            {questions.length === 0 ?
          <p className="text-[13px] text-muted">The questions for this form are no longer available.</p> :

          <ol className="space-y-3">
                {questions.map((question, index) => {
              const answer = responses[question.id];
              return (
                <li key={question.id} className="rounded-lg border border-line px-4 py-3">
                      <p className="text-[13px] font-medium text-ink">
                        <span className="mr-1.5 text-subtle">{index + 1}.</span>
                        {question.label}
                        {question.required && <span className="ml-0.5 text-red-500">*</span>}
                      </p>
                      <p className="mt-0.5 text-[11px] uppercase tracking-wide text-subtle">{question.answerType}</p>
                      <p
                    className={`mt-2 whitespace-pre-line break-words text-[13px] ${
                    answer?.trim() ? 'text-ink' : 'italic text-subtle'}`
                    }>

                        {answerText(question, answer)}
                      </p>
                    </li>);

            })}
              </ol>
          }
          </div>
        </>
      }
    </Drawer>);

}
