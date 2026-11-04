import type { FeedbackForm, FeedbackQuestion } from '../types';

type QuestionSeed = [label: string, answerType: FeedbackQuestion['answerType'], required: boolean, description?: string];

function questions(formId: string, seeds: QuestionSeed[]): FeedbackQuestion[] {
  return seeds.map(([label, answerType, required, description = ''], index) => ({
    id: `${formId}-q${index + 1}`,
    label,
    answerType,
    required,
    description
  }));
}

function form(
id: string,
number: number,
name: string,
description: string,
status: FeedbackForm['status'],
createdAt: string,
seeds: QuestionSeed[])
: FeedbackForm {
  return {
    id,
    code: `EXF-${String(number).padStart(3, '0')}`,
    name,
    description,
    status,
    questions: questions(id, seeds),
    createdBy: 'Nimal Perera',
    createdAt,
    updatedAt: createdAt
  };
}

const standardExit: QuestionSeed[] = [
['How would you rate your overall experience working here?', 'Rating Scale', true, '1 is very poor and 5 is excellent.'],
['What is the main reason you decided to leave?', 'Long Comment', true],
['Did you feel your work was recognised?', 'Yes / No', true],
['How would you rate the support you received from your reporting manager?', 'Rating Scale', true],
['Would you recommend us as a place to work?', 'Yes / No', false],
['What could we have done to keep you?', 'Long Comment', false, 'Be as specific as you can. Your answer is kept confidential.'],
['Anything else you would like to share?', 'Short Comment', false]];


export const seedFeedbackForms: FeedbackForm[] = [
form('fbf1', 1, 'Standard Exit Interview', 'Asked of every leaver before their last working date.', 'Active', '2026-03-02T09:00:00', standardExit),
form('fbf2', 2, 'Engineering Exit Survey', 'Adds questions on tooling, code quality and growth paths.', 'Active', '2026-03-09T10:30:00', [
...standardExit.slice(0, 3),
['How would you rate the engineering tools and environment?', 'Rating Scale', true],
['Did you have a clear path for growth?', 'Yes / No', true],
['What would you change about how the team works?', 'Long Comment', false]]
),
form('fbf3', 3, 'Intern Programme Feedback', 'For interns finishing their programme.', 'Active', '2026-04-01T08:45:00', [
['How would you rate the internship overall?', 'Rating Scale', true],
['Did your mentor give you enough guidance?', 'Yes / No', true],
['Which project did you learn the most from?', 'Short Comment', false],
['What should we improve for the next group of interns?', 'Long Comment', false]]
),
form('fbf4', 4, 'Contract Completion Feedback', 'For contractors at the end of their engagement.', 'Active', '2026-04-14T11:15:00', [
['How clear were the goals of your engagement?', 'Rating Scale', true],
['Were you paid on time throughout the contract?', 'Yes / No', true],
['Would you work with us again?', 'Yes / No', false],
['Any comments for the hiring team?', 'Short Comment', false]]
),
form('fbf5', 5, 'Standard Exit Interview', 'Previous version, kept for reference.', 'Inactive', '2025-11-20T09:00:00', standardExit.slice(0, 5)),
form('fbf6', 6, 'Retirement Farewell Feedback', 'For long-serving employees who are retiring.', 'Active', '2026-05-05T14:00:00', [
['Looking back, how would you rate your time with us?', 'Rating Scale', true],
['What are you most proud of from your time here?', 'Long Comment', false],
['Would you like to stay in touch through the alumni network?', 'Yes / No', false]]
),
form('fbf7', 7, 'Sales Team Exit Survey', 'Adds questions on targets and commission.', 'Active', '2026-05-18T09:30:00', [
...standardExit.slice(0, 2),
['How fair did you find your targets?', 'Rating Scale', true],
['Was the commission structure clear?', 'Yes / No', true]]
),
form('fbf8', 8, 'Manager Exit Survey', 'For people managers leaving the company.', 'Active', '2026-06-02T10:00:00', [
...standardExit.slice(0, 3),
['How well were you supported as a people manager?', 'Rating Scale', true],
['Who would you suggest to take over your team?', 'Short Comment', false]]
),
form('fbf9', 9, 'Probation Exit Feedback', 'For employees leaving during probation.', 'Inactive', '2026-06-20T15:20:00', [
['How well did your role match the job description?', 'Rating Scale', true],
['Was your onboarding helpful?', 'Yes / No', true],
['What would have helped you settle in?', 'Long Comment', false]]
),
form('fbf10', 10, 'Remote Employee Exit Survey', 'Adds questions on remote working.', 'Active', '2026-07-08T09:10:00', [
...standardExit.slice(0, 2),
['How connected did you feel to your team?', 'Rating Scale', true],
['Did you have the equipment you needed at home?', 'Yes / No', true]]
),
form('fbf11', 11, 'Finance Team Exit Survey', 'For leavers from Finance.', 'Active', '2026-08-11T13:00:00', standardExit.slice(0, 4)),
form('fbf12', 12, 'Short Exit Pulse', 'Three quick questions when there is no time for a full interview.', 'Active', '2026-09-01T09:00:00', [
['How would you rate your experience overall?', 'Rating Scale', true],
['Would you recommend us as a place to work?', 'Yes / No', true],
['One thing we should change?', 'Short Comment', false]]
)];
