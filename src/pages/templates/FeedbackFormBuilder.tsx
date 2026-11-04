import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { EyeIcon, LockIcon, MessageSquareTextIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Input, Label, Select, Textarea } from '../../components/ui/Field';
import { PillToggle } from '../../components/ui/Toggle';
import { FeedbackFormPreview } from '../../components/feedback/FeedbackFormPreview';
import { useFeedbackForms } from '../../contexts/FeedbackFormsContext';
import type { FeedbackAnswerType, FeedbackQuestion } from '../../types';
import {
  FEEDBACK_ANSWER_TYPES,
  FEEDBACK_FORMS_PATH,
  SENT_EDIT_HINT,
  feedbackFormErrors,
  hasBeenSent,
  hasFeedbackFormErrors,
  newFeedbackQuestion,
  type FeedbackFormDraft } from
'../../utils/feedbackForms';
import { useScreenInit } from '../../useScreenInit.js';

interface BuilderScreenState {
  draft?: FeedbackFormDraft;
  showErrors?: boolean;
  preview?: boolean;
}

const EMPTY_DRAFT: FeedbackFormDraft = { name: '', description: '', questions: [] };

/** Create a feedback form template, or edit one (at /:formId/edit). */
export function FeedbackFormBuilder() {
  const { formId } = useParams();
  const { feedbackForms } = useFeedbackForms();
  const editing = formId ? feedbackForms.find((item) => item.id === formId) : undefined;
  if (formId && !editing) return <Navigate to={FEEDBACK_FORMS_PATH} replace />;
  if (editing && hasBeenSent(editing)) {
    return <Navigate to={`${FEEDBACK_FORMS_PATH}/${editing.id}`} replace state={{ notice: SENT_EDIT_HINT }} />;
  }
  return <Builder key={formId ?? 'new'} formId={editing?.id} />;
}

function Builder({ formId }: {formId?: string;}) {
  const navigate = useNavigate();
  const screenInit = useScreenInit() as BuilderScreenState;
  const { feedbackForms, nextCode, createFeedbackForm, updateFeedbackForm } = useFeedbackForms();
  const editing = feedbackForms.find((item) => item.id === formId);

  const [draft, setDraft] = useState<FeedbackFormDraft>(
    editing ?
    { name: editing.name, description: editing.description, questions: editing.questions } :
    screenInit.draft ?? EMPTY_DRAFT
  );
  const [submitted, setSubmitted] = useState(Boolean(screenInit.showErrors));
  const [previewing, setPreviewing] = useState(Boolean(screenInit.preview));

  const errors = feedbackFormErrors(draft);
  const code = editing?.code ?? nextCode;

  const updateQuestion = (id: string, patch: Partial<FeedbackQuestion>) =>
  setDraft((prev) => ({
    ...prev,
    questions: prev.questions.map((question) => question.id === id ? { ...question, ...patch } : question)
  }));

  const removeQuestion = (id: string) =>
  setDraft((prev) => ({ ...prev, questions: prev.questions.filter((question) => question.id !== id) }));

  const addQuestion = () => setDraft((prev) => ({ ...prev, questions: [...prev.questions, newFeedbackQuestion()] }));

  const save = () => {
    setSubmitted(true);
    if (hasFeedbackFormErrors(errors)) return;
    if (editing) {
      updateFeedbackForm(editing.id, draft);
      navigate(`${FEEDBACK_FORMS_PATH}/${editing.id}`, { state: { notice: `${editing.code} was updated.` } });
      return;
    }
    const created = createFeedbackForm(draft);
    navigate(FEEDBACK_FORMS_PATH, {
      state: { notice: `${created.name} (${created.code}) was created and is active.` }
    });
  };

  const cancel = () => navigate(editing ? `${FEEDBACK_FORMS_PATH}/${editing.id}` : FEEDBACK_FORMS_PATH);

  return (
    <div>
      <PageHeader
        title={editing ? `Edit ${editing.name}` : 'New Exit Feedback Form'}
        subtitle="The same questions are asked of everyone who receives this form."
        backTo={editing ? `${FEEDBACK_FORMS_PATH}/${editing.id}` : FEEDBACK_FORMS_PATH}
        backLabel={editing ? 'Back to form' : 'Back to Exit Feedback'} />


      <div className="mx-auto max-w-4xl space-y-5 px-8 py-6">
        <section className="rounded-xl border border-line bg-white p-6">
          <h2 className="text-[14px] font-semibold text-ink">Form details</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="fbf-code">Form code</Label>
              <div
                id="fbf-code"
                className="flex h-10 items-center gap-2 rounded-lg border border-line bg-slate-50 px-3 font-mono text-[13px] text-muted">

                <LockIcon className="h-3.5 w-3.5 text-subtle" />
                {code}
              </div>
              <p className="mt-1 text-[11px] text-subtle">
                {editing ? 'Codes cannot be changed.' : 'Generated automatically. Cannot be changed.'}
              </p>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="fbf-name" required>
                Form name
              </Label>
              <Input
                id="fbf-name"
                value={draft.name}
                onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="e.g. Standard Exit Interview"
                maxLength={120}
                aria-invalid={submitted && Boolean(errors.name)}
                className={submitted && errors.name ? 'border-red-400' : undefined} />

              {submitted && errors.name && <p className="mt-1 text-[12px] text-red-600">{errors.name}</p>}
            </div>
            <div className="sm:col-span-3">
              <Label htmlFor="fbf-description">Description</Label>
              <Textarea
                id="fbf-description"
                value={draft.description}
                onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="When this form is used and who it is for (optional)"
                maxLength={500}
                rows={3} />

            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-line bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-6 py-4">
            <div>
              <h2 className="text-[14px] font-semibold text-ink">Questions</h2>
              <p className="mt-0.5 text-[12px] text-muted">Asked in this order. New questions are optional until marked required.</p>
            </div>
            <span className="text-[12px] text-muted">
              {draft.questions.length} question{draft.questions.length === 1 ? '' : 's'}
            </span>
          </div>

          {draft.questions.length === 0 ?
          <div
            className={twMerge(
              'm-6 flex flex-col items-center rounded-lg border border-dashed px-6 py-8 text-center',
              submitted && errors.questions ? 'border-red-300 bg-red-50/40' : 'border-line'
            )}>

              <MessageSquareTextIcon className="h-5 w-5 text-subtle" />
              <p className="mt-2 text-[13px] font-medium text-ink">No questions yet</p>
              <p className="mt-0.5 text-[12px] text-muted">A form needs at least one question before it can be saved.</p>
              {submitted && errors.questions && <p className="mt-2 text-[12px] text-red-600">{errors.questions}</p>}
            </div> :

          <ol className="divide-y divide-line">
              {draft.questions.map((question, index) =>
            <QuestionRow
              key={question.id}
              number={index + 1}
              question={question}
              showErrors={submitted}
              onChange={(patch) => updateQuestion(question.id, patch)}
              onRemove={() => removeQuestion(question.id)} />

            )}
            </ol>
          }

          <div className="border-t border-line px-6 py-4">
            <Button
              size="sm"
              onClick={addQuestion}
              className="border border-dashed border-slate-300 text-muted ring-0 hover:border-slate-400 hover:text-ink">

              <PlusIcon className="h-3.5 w-3.5" />
              Add Question
            </Button>
          </div>
        </section>
      </div>

      <div className="sticky bottom-0 border-t border-line bg-white/95 px-8 py-3.5 backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-end gap-2">
          {submitted && hasFeedbackFormErrors(errors) &&
          <p className="mr-auto text-[12px] text-red-600">Complete the highlighted fields before saving.</p>
          }
          <Button onClick={cancel}>Cancel</Button>
          <Button onClick={() => setPreviewing(true)}>
            <EyeIcon className="h-4 w-4" />
            Preview
          </Button>
          <Button variant="primary" onClick={save}>
            {editing ? 'Save changes' : 'Create Form'}
          </Button>
        </div>
      </div>

      <FeedbackFormPreview
        open={previewing}
        name={draft.name}
        description={draft.description}
        questions={draft.questions}
        onClose={() => setPreviewing(false)} />

    </div>);

}

function QuestionRow({
  number,
  question,
  showErrors,
  onChange,
  onRemove






}: {number: number;question: FeedbackQuestion;showErrors: boolean;onChange: (patch: Partial<FeedbackQuestion>) => void;onRemove: () => void;}) {
  const missingLabel = showErrors && !question.label.trim();
  return (
    <li className="flex gap-3 px-6 py-4 transition-colors duration-150 ease-out hover:bg-slate-50/50">
      <span className="mt-2.5 w-5 shrink-0 text-right text-[12px] font-medium text-subtle">{number}.</span>
      <div className="min-w-0 flex-1 space-y-2.5">
        <div className="flex flex-col gap-2.5 md:flex-row md:items-start">
          <div className="min-w-0 flex-1">
            <Input
              value={question.label}
              onChange={(event) => onChange({ label: event.target.value })}
              placeholder="Question label (e.g. How would you rate your manager's support?)"
              aria-label={`Question ${number} label`}
              aria-invalid={missingLabel}
              maxLength={250}
              className={twMerge('h-9', missingLabel && 'border-red-400')} />

            {missingLabel && <p className="mt-1 text-[12px] text-red-600">Question label is required.</p>}
          </div>
          <Select
            value={question.answerType}
            onChange={(event) => onChange({ answerType: event.target.value as FeedbackAnswerType })}
            aria-label={`Question ${number} answer type`}
            className="h-9 md:w-44">

            {FEEDBACK_ANSWER_TYPES.map((type) =>
            <option key={type} value={type}>
                {type === 'Rating Scale' ? 'Rating Scale (1–5)' : type}
              </option>
            )}
          </Select>
          <PillToggle
            options={[
            { value: 'optional', label: 'Optional' },
            { value: 'required', label: 'Required' }]
            }
            value={question.required ? 'required' : 'optional'}
            onChange={(value) => onChange({ required: value === 'required' })} />

          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove question ${number}`}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors duration-150 ease-out hover:bg-red-50 hover:text-red-600">

            <Trash2Icon className="h-4 w-4" />
          </button>
        </div>
        <Input
          value={question.description}
          onChange={(event) => onChange({ description: event.target.value })}
          placeholder="Description or guidelines (optional)"
          aria-label={`Question ${number} description`}
          maxLength={300}
          className="h-9" />

      </div>
    </li>);

}
