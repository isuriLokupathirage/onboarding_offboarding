import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppDataProvider } from './contexts/AppDataContext';
import { EmployeeDataProvider } from './contexts/EmployeeDataContext';
import { AppShell } from './components/layout/AppShell';
import { EmployeeList } from './pages/employees/EmployeeList';
import { EmployeeDetail } from './pages/employees/EmployeeDetail';
import { EmployeeFormLink } from './pages/portal/EmployeeFormLink';
import { Overview } from './pages/onboarding/Overview';
import { Transitions } from './pages/onboarding/Transitions';
import { NewTransition } from './pages/onboarding/NewTransition';
import { TransitionDetail } from './pages/onboarding/TransitionDetail';
import { TaskTemplates } from './pages/onboarding/TaskTemplates';
import { CreateTask } from './pages/onboarding/CreateTask';
import { CreateTemplate } from './pages/onboarding/CreateTemplate';
import { EmployeeForms } from './pages/templates/EmployeeForms';
import { FormDetail } from './pages/templates/FormDetail';
import { BackgroundCheckForms } from './pages/templates/BackgroundCheckForms';
import { RecruitmentEmails } from './pages/templates/RecruitmentEmails';
import { Portal, PortalEntry } from './pages/portal/Portal';
import { MyTasks } from './pages/tasks/MyTasks';
import type { OboPermission } from './types';

interface AppProps {
  /** Show the candidate portal's My Schedule tab in its empty state. */
  portalEventsEmpty?: boolean;
  /** Simulate the signed-in user holding the Send Employee Forms (employee.form.send) permission. */
  canSendEmployeeForms?: boolean;
  /** Simulate the signed-in user holding manage rights on employee forms, rather than view only. */
  canManageEmployeeForms?: boolean;
  /** Simulate the Onboarding & Offboarding permissions held by the signed-in user. */
  oboPermissions?: OboPermission[];
}

export function App({
  portalEventsEmpty = false,
  canSendEmployeeForms = true,
  canManageEmployeeForms = true,
  oboPermissions
}: AppProps) {
  return (
    <AppDataProvider canManageForms={canManageEmployeeForms} oboPermissions={oboPermissions}>
      <EmployeeDataProvider canSendForms={canSendEmployeeForms}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route index element={<Navigate to="/onboarding/overview" replace />} />
            <Route path="tasks/my-tasks" element={<MyTasks />} />
            <Route path="onboarding/overview" element={<Overview />} />
            <Route path="onboarding/transitions" element={<Transitions />} />
            <Route path="onboarding/transitions/new" element={<NewTransition />} />
            <Route path="onboarding/transitions/:transitionId" element={<TransitionDetail />} />
            <Route path="onboarding/templates" element={<TaskTemplates />} />
            <Route path="onboarding/templates/new-task" element={<CreateTask />} />
            <Route path="onboarding/templates/new-template" element={<CreateTemplate />} />
            <Route path="templates/forms/employee" element={<EmployeeForms />} />
            <Route path="templates/forms/employee/:formId" element={<FormDetail />} />
            <Route path="templates/forms/background-check" element={<BackgroundCheckForms />} />
            <Route path="templates/emails/recruitment" element={<RecruitmentEmails />} />
            <Route path="employees" element={<EmployeeList />} />
            <Route path="employees/:employeeId" element={<EmployeeDetail />} />
          </Route>
          <Route path="/portal" element={<PortalEntry />} />
          <Route path="/portal/:token" element={<Portal eventsEmpty={portalEventsEmpty} />} />
          <Route path="/employee-form/:assignmentId" element={<EmployeeFormLink />} />
          <Route path="*" element={<Navigate to="/onboarding/overview" replace />} />
        </Routes>
      </BrowserRouter>
      </EmployeeDataProvider>
    </AppDataProvider>);

}