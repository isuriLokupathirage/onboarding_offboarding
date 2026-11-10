import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { FeedbackForm } from '../types';
import { seedFeedbackForms } from '../data/feedbackForms';
import { peopleById } from '../data/people';
import { useAppData } from './AppDataContext';
import {
  cleanFeedbackDraft,
  feedbackFormCode,
  hasBeenSent,
  highestFeedbackCodeNumber,
  type FeedbackFormDraft } from
'../utils/feedbackForms';

interface FeedbackFormsValue {
  feedbackForms: FeedbackForm[];
  /** The code the next new form will get. */
  nextCode: string;
  /** Saves a new form with status Active. Returns it. */
  createFeedbackForm: (draft: FeedbackFormDraft) => FeedbackForm;
  updateFeedbackForm: (id: string, draft: FeedbackFormDraft) => void;
  /** Copies a form under a new code. Returns the copy. */
  duplicateFeedbackForm: (id: string) => FeedbackForm | undefined;
  setFeedbackFormStatus: (id: string, status: FeedbackForm['status']) => void;
  deleteFeedbackForm: (id: string) => void;
  /** Counts one more send of each form. A sent form can no longer be edited or deleted. */
  recordFeedbackFormsSent: (ids: string[]) => void;
}

const FeedbackFormsContext = createContext<FeedbackFormsValue | null>(null);

export function FeedbackFormsProvider({ children }: {children: ReactNode;}) {
  const { currentUserId } = useAppData();
  const [feedbackForms, setFeedbackForms] = useState<FeedbackForm[]>(seedFeedbackForms);
  // The last code number handed out. Codes are the unique identifier, so a deleted form's code is never reused.
  const [lastCodeNumber, setLastCodeNumber] = useState(() => highestFeedbackCodeNumber(seedFeedbackForms));
  const nextCode = feedbackFormCode(lastCodeNumber + 1);
  const author = peopleById[currentUserId]?.name ?? currentUserId;

  const createFeedbackForm = useCallback(
    (draft: FeedbackFormDraft): FeedbackForm => {
      const now = new Date().toISOString();
      const created: FeedbackForm = {
        ...cleanFeedbackDraft(draft),
        id: `fbf-${Date.now()}`,
        code: nextCode,
        status: 'Active',
        sentCount: 0,
        responseCount: 0,
        createdBy: author,
        createdAt: now,
        updatedAt: now
      };
      setFeedbackForms((prev) => [created, ...prev]);
      setLastCodeNumber((prev) => prev + 1);
      return created;
    },
    [nextCode, author]
  );

  // A form that has been sent keeps its questions, so past responses still match them.
  const updateFeedbackForm = useCallback((id: string, draft: FeedbackFormDraft) => {
    const updatedAt = new Date().toISOString();
    setFeedbackForms((prev) =>
    prev.map((item) =>
    item.id === id && !hasBeenSent(item) ? { ...item, ...cleanFeedbackDraft(draft), updatedAt } : item
    )
    );
  }, []);

  const duplicateFeedbackForm = useCallback(
    (id: string): FeedbackForm | undefined => {
      const source = feedbackForms.find((item) => item.id === id);
      if (!source) return undefined;
      const now = new Date().toISOString();
      const copyId = `fbf-${Date.now()}`;
      const copy: FeedbackForm = {
        ...source,
        id: copyId,
        code: nextCode,
        name: `Copy of ${source.name}`,
        status: 'Active',
        sentCount: 0,
        responseCount: 0,
        questions: source.questions.map((question, index) => ({ ...question, id: `${copyId}-q${index + 1}` })),
        createdBy: author,
        createdAt: now,
        updatedAt: now
      };
      setFeedbackForms((prev) => [copy, ...prev]);
      setLastCodeNumber((prev) => prev + 1);
      return copy;
    },
    [feedbackForms, nextCode, author]
  );

  const setFeedbackFormStatus = useCallback((id: string, status: FeedbackForm['status']) => {
    const updatedAt = new Date().toISOString();
    setFeedbackForms((prev) => prev.map((item) => item.id === id ? { ...item, status, updatedAt } : item));
  }, []);

  // Only a form that has never been sent can be deleted. A sent one is deactivated instead.
  const deleteFeedbackForm = useCallback((id: string) => {
    setFeedbackForms((prev) => prev.filter((item) => item.id !== id || hasBeenSent(item)));
  }, []);

  const recordFeedbackFormsSent = useCallback((ids: string[]) => {
    setFeedbackForms((prev) =>
    prev.map((item) => ids.includes(item.id) ? { ...item, sentCount: item.sentCount + 1 } : item)
    );
  }, []);

  const value = useMemo(
    () => ({
      feedbackForms,
      nextCode,
      createFeedbackForm,
      updateFeedbackForm,
      duplicateFeedbackForm,
      setFeedbackFormStatus,
      deleteFeedbackForm,
      recordFeedbackFormsSent
    }),
    [
    feedbackForms,
    nextCode,
    createFeedbackForm,
    updateFeedbackForm,
    duplicateFeedbackForm,
    setFeedbackFormStatus,
    deleteFeedbackForm,
    recordFeedbackFormsSent]

  );

  return <FeedbackFormsContext.Provider value={value}>{children}</FeedbackFormsContext.Provider>;
}

// The hook lives beside its provider, as in the other contexts.
// eslint-disable-next-line react-refresh/only-export-components
export function useFeedbackForms(): FeedbackFormsValue {
  const value = useContext(FeedbackFormsContext);
  if (!value) throw new Error('useFeedbackForms must be used inside FeedbackFormsProvider');
  return value;
}
