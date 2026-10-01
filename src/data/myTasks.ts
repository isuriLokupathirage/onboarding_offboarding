export interface RecruitmentTaskItem {
  kind: 'recruitment';
  id: string;
  candidate: string;
  role: string;
  stage: string;
  stageType: string;
  date: string;
  time: string;
  status: string;
}

export interface JdApprovalItem {
  kind: 'jd';
  id: string;
  title: string;
  code: string;
  version: string;
  company: string;
  department: string;
  employmentType: string;
  submittedBy: string;
  submittedOn: string;
}

export interface RequisitionApprovalItem {
  kind: 'requisition';
  id: string;
  title: string;
  department: string;
  requester: string;
  code: string;
  workflow: string;
  step: string;
  submittedOn: string;
  priority: string;
}

export const recruitmentTasks: RecruitmentTaskItem[] = [
{
  kind: 'recruitment',
  id: 'rec1',
  candidate: 'Chamara Ekanayake',
  role: 'QA Manager',
  stage: 'Coding Test',
  stageType: 'Assessment',
  date: '2026-10-05',
  time: '3:00 PM – 3:30 PM',
  status: 'In Progress'
}];


export const jdApprovals: JdApprovalItem[] = [
{
  kind: 'jd',
  id: 'jd1',
  title: 'Head of Sales – Production',
  code: 'JD-XEYNERGY-QA2-009',
  version: 'V1',
  company: 'LankaTech Solutions (Pvt) Ltd.',
  department: 'Sales',
  employmentType: 'Part-time',
  submittedBy: 'Isuri Lokupathirage',
  submittedOn: 'Sep 22, 2026 05:02 PM'
},
{
  kind: 'jd',
  id: 'jd2',
  title: 'MASS',
  code: 'JD-XEYNERGY-QA2-013',
  version: 'V2',
  company: 'LankaTech Solutions (Pvt) Ltd.',
  department: 'Information Technology',
  employmentType: 'Intern',
  submittedBy: 'Isuri Lokupathirage',
  submittedOn: 'Sep 23, 2026 02:26 PM'
},
{
  kind: 'jd',
  id: 'jd3',
  title: 'Operations Executive',
  code: 'JD-XEYNERGY-QA2-097',
  version: 'V1',
  company: 'Metropolitan Technologies (Pvt) Ltd',
  department: 'Group Internal Audit',
  employmentType: 'Contract',
  submittedBy: 'Isuri Lokupathirage',
  submittedOn: 'Sep 24, 2026 10:15 AM'
}];


export const requisitionApprovals: RequisitionApprovalItem[] = [
{
  kind: 'requisition',
  id: 'req1',
  title: 'Executive – Administration & Facilities',
  department: 'Administration & Facilities',
  requester: 'Asela Wijeratne',
  code: 'REQ-2026-005',
  workflow: 'Secondary Workflow',
  step: 'Step 2 of 3 — SBU / Functional Director',
  submittedOn: 'Sep 24, 2026',
  priority: 'Medium'
},
{
  kind: 'requisition',
  id: 'req2',
  title: 'Assistant Manager – Internal Audit',
  department: 'Group Internal Audit',
  requester: 'Sangeeth Peiris',
  code: 'REQ-2026-020',
  workflow: 'Data Analyst',
  step: 'Step 1 of 4 — HR',
  submittedOn: 'Sep 25, 2026',
  priority: 'Medium'
}];
