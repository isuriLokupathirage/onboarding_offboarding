import type { FeedbackAnswerType, FeedbackForm, FeedbackQuestion, OboPermission } from '../types';

export const FEEDBACK_ANSWER_TYPES: FeedbackAnswerType[] = ['Rating Scale', 'Yes / No', 'Short Comment', 'Long Comment'];

export const RATING_SCALE = [1, 2, 3, 4, 5];

export const FEEDBACK_FORMS_PATH = '/templates/forms/exit-feedback';

export function canViewFeedbackForms(permissions: OboPermission[]): boolean {
  return permissions.includes('View Exit Feedback Forms') || permissions.includes('Manage Exit Feedback Forms');
}

export function canManageFeedbackForms(permissions: OboPermission[]): boolean {
  return permissions.includes('Manage Exit Feedback Forms');
}

export function feedbackFormCode(number: number): string {
  return `EXF-${String(number).padStart(3, '0')}`;
}

/** The highest NNN among the forms' EXF-NNN codes. */
export function highestFeedbackCodeNumber(forms: FeedbackForm[]): number {
  return forms.reduce((max, item) => Math.max(max, Number(item.code.replace(/\D/g, '')) || 0), 0);
}

export function newFeedbackQuestion(): FeedbackQuestion {
  return {
    id: `q-${Date.now()}-${Math.round(Math.random() * 10000)}`,
    label: '',
    answerType: 'Rating Scale',
    description: '',
    required: false
  };
}

export interface FeedbackFormDraft {
  name: string;
  description: string;
  questions: FeedbackQuestion[];
}

export interface FeedbackFormErrors {
  name?: string;
  questions?: string;
  /** Question ids without a label. */
  unlabelled: string[];
}

export function feedbackFormErrors(draft: FeedbackFormDraft): FeedbackFormErrors {
  return {
    name: draft.name.trim() ? undefined : 'Enter a form name.',
    questions: draft.questions.length > 0 ? undefined : 'Add at least one question before saving the form.',
    unlabelled: draft.questions.filter((question) => !question.label.trim()).map((question) => question.id)
  };
}

export function hasFeedbackFormErrors(errors: FeedbackFormErrors): boolean {
  return Boolean(errors.name || errors.questions || errors.unlabelled.length > 0);
}

/** Trims what the user typed before the form is saved. */
export function cleanFeedbackDraft(draft: FeedbackFormDraft): FeedbackFormDraft {
  return {
    name: draft.name.trim(),
    description: draft.description.trim(),
    questions: draft.questions.map((question) => ({
      ...question,
      label: question.label.trim(),
      description: question.description.trim()
    }))
  };
}
