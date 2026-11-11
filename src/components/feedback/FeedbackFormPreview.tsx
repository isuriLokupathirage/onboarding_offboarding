import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { EyeIcon, RotateCcwIcon, XIcon } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import type { FeedbackQuestion } from '../../types';
import { Button } from '../ui/Button';
import { Input, Textarea } from '../ui/Field';
import { RATING_SCALE } from '../../utils/feedbackForms';

/**
 * The form as the recipient will see it, questions in order and required ones marked.
 * Answers can be typed to try the form, but they are never saved or submitted.
 */
export function FeedbackFormPreview({
  open,
  name,
  description,
  questions,
  onClose





}: {open: boolean;name: string;description: string;questions: FeedbackQuestion[];onClose: () => void;}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [triedSubmit, setTriedSubmit] = useState(false);

  // Each preview starts empty.
  useEffect(() => {
    if (!open) return;
    setAnswers({});
    setTriedSubmit(false);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const answer = (id: string, value: string) => setAnswers((prev) => ({ ...prev, [id]: value }));
  const answered = questions.filter((question) => answers[question.id]?.trim()).length;

  return (
    <AnimatePresence>
      {open &&
      <div className="fixed inset-0 z-50 flex justify-center overflow-y-auto bg-slate-900/40 p-4 sm:p-8">
          <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={`Preview of ${name || 'the form'}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.15 }}
          className="h-fit w-full max-w-2xl overflow-hidden rounded-2xl bg-slate-50 shadow-xl">

            <div className="flex items-center gap-3 bg-ink px-5 py-3 text-white">
              <EyeIcon className="h-4 w-4 shrink-0" />
              <p className="min-w-0 flex-1 text-[13px]">
                <span className="font-semibold">Preview.</span> You can try answering, but nothing is saved or
                submitted.
              </p>
              <button
              type="button"
              onClick={onClose}
              aria-label="Close preview"
              className="rounded-lg p-1.5 text-white/80 transition-colors duration-150 ease-out hover:bg-white/10 hover:text-white">

                <XIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 sm:p-8">
              <header className="rounded-xl border border-line bg-white p-6">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">Exit feedback</p>
                <h2 className="mt-1 text-lg font-semibold text-ink">{name.trim() || 'Untitled form'}</h2>
                {description.trim() &&
              <p className="mt-1.5 whitespace-pre-line text-[13px] text-muted">{description.trim()}</p>
              }
                <p className="mt-3 text-[12px] text-muted">
                  Questions marked <span className="text-red-500">*</span> are required.
                </p>
              </header>

              {questions.length === 0 ?
            <p className="mt-4 rounded-xl border border-dashed border-line bg-white p-6 text-center text-[13px] text-muted">
                  This form has no questions yet.
                </p> :

            <ol className="mt-4 space-y-3">
                  {questions.map((question, index) => {
                const missing = triedSubmit && question.required && !answers[question.id]?.trim();
                return (
                  <li
                    key={question.id}
                    className={twMerge(
                      'rounded-xl border bg-white p-5',
                      missing ? 'border-red-300' : 'border-line'
                    )}>

                        <p className="text-[14px] font-medium text-ink">
                          <span className="mr-1.5 text-subtle">{index + 1}.</span>
                          {question.label.trim() || 'Untitled question'}
                          {question.required && <span className="ml-0.5 text-red-500">*</span>}
                        </p>
                        {question.description.trim() &&
                    <p className="mt-1 text-[12px] text-muted">{question.description.trim()}</p>
                    }
                        <div className="mt-3">
                          <AnswerInput
                        question={question}
                        value={answers[question.id] ?? ''}
                        onChange={(value) => answer(question.id, value)} />

                        </div>
                        {missing && <p className="mt-2 text-[12px] text-red-600">This question is required.</p>}
                      </li>);

              })}
                </ol>
            }

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <p className="text-[12px] text-muted">
                  {answered} of {questions.length} answered
                </p>
                <div className="flex items-center gap-2">
                  <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setAnswers({});
                    setTriedSubmit(false);
                  }}>

                    <RotateCcwIcon className="h-3.5 w-3.5" />
                    Clear answers
                  </Button>
                  <Button size="sm" variant="primary" onClick={() => setTriedSubmit(true)}>
                    Submit
                  </Button>
                </div>
              </div>
              {triedSubmit &&
            <p className="mt-3 rounded-lg bg-sky-50 px-3.5 py-2.5 text-[12px] text-sky-900 ring-1 ring-inset ring-sky-200">
                  In the preview, Submit only checks the required questions. Nothing is sent or saved.
                </p>
            }
            </div>
          </motion.div>
        </div>
      }
    </AnimatePresence>);

}

/** One question's answer control. Shared with the portal, where the recipient answers for real. */
export function AnswerInput({
  question,
  value,
  onChange



}: {question: FeedbackQuestion;value: string;onChange: (value: string) => void;}) {
  if (question.answerType === 'Rating Scale') {
    return (
      <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label={question.label}>
        {RATING_SCALE.map((rating) =>
        <button
          key={rating}
          type="button"
          role="radio"
          aria-checked={value === String(rating)}
          onClick={() => onChange(value === String(rating) ? '' : String(rating))}
          className={twMerge(
            'h-10 w-10 rounded-lg border text-[13px] font-medium transition-colors duration-150 ease-out',
            value === String(rating) ?
            'border-brand-500 bg-brand-500 text-white' :
            'border-line bg-white text-ink hover:bg-slate-50'
          )}>

            {rating}
          </button>
        )}
        <span className="ml-1 text-[11px] text-subtle">1 = Poor · 5 = Excellent</span>
      </div>);

  }
  if (question.answerType === 'Yes / No') {
    return (
      <div className="flex gap-2" role="radiogroup" aria-label={question.label}>
        {['Yes', 'No'].map((option) =>
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={value === option}
          onClick={() => onChange(value === option ? '' : option)}
          className={twMerge(
            'h-9 rounded-lg border px-5 text-[13px] font-medium transition-colors duration-150 ease-out',
            value === option ?
            'border-brand-500 bg-brand-50 text-brand-700' :
            'border-line bg-white text-ink hover:bg-slate-50'
          )}>

            {option}
          </button>
        )}
      </div>);

  }
  if (question.answerType === 'Short Comment') {
    return (
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Your answer"
        aria-label={question.label}
        maxLength={250} />);


  }
  return (
    <Textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Your answer"
      aria-label={question.label}
      rows={4} />);


}
