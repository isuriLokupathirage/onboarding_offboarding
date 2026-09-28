import type { EmployeeForm, FormSection, RequiredDocument } from '../types';

export const LOCK_TOOLTIP = 'Required by Employee Management';

export const MANDATORY_FIELD_IDS = ['firstName', 'lastName', 'nic', 'dob', 'email'];

export const tshirtOptions = [
'Extra Small (XS)',
'Small (S)',
'Medium (M)',
'Large (L)',
'Extra Large (XL)',
'Double Extra Large (XXL)',
'Other'];


export const mealOptions = ['Vegetarian', 'Non-Vegetarian', 'Vegan', 'Halal', 'Other'];

export const genderOptions = ['Male', 'Female', 'Other'];

export const civilStatusOptions = ['Single', 'Married'];

export const liquorOptions = ['Yes', 'No'];

export const currencyOptions = ['Savings — LKR', 'Current — LKR', 'Savings — USD', 'Current — USD'];

export function buildSections(): FormSection[] {
  return [
  {
    id: 'personal',
    title: 'Personal Details',
    enabled: true,
    fields: [
    { id: 'firstName', name: 'First Name', dataType: 'Text', state: 'Required', locked: true },
    { id: 'lastName', name: 'Last Name', dataType: 'Text', state: 'Required', locked: true },
    { id: 'nic', name: 'NIC / Passport Number', dataType: 'Text', state: 'Required', locked: true },
    { id: 'dob', name: 'Date of Birth', dataType: 'Date', state: 'Required', locked: true },
    {
      id: 'gender',
      name: 'Gender',
      dataType: 'Dropdown',
      state: 'Optional',
      options: genderOptions,
      allowOther: true
    },
    { id: 'nationality', name: 'Nationality', dataType: 'Text', state: 'Optional' },
    {
      id: 'marital',
      name: 'Civil Status',
      dataType: 'Dropdown',
      state: 'Required',
      options: civilStatusOptions
    },
    { id: 'tin', name: 'Tax ID (TIN)', dataType: 'Text', state: 'Optional' }]

  },
  {
    id: 'contact',
    title: 'Contact Details',
    enabled: true,
    fields: [
    { id: 'permAddress', name: 'Permanent Address', dataType: 'Long text', state: 'Required' },
    { id: 'tempAddress', name: 'Temporary Address', dataType: 'Long text', state: 'Optional' },
    { id: 'homeNumber', name: 'Home Number', dataType: 'Phone', state: 'Optional' },
    { id: 'mobile', name: 'Personal Mobile Number', dataType: 'Phone', state: 'Required' },
    { id: 'email', name: 'Personal Email', dataType: 'Email', state: 'Required', locked: true }]

  },
  {
    id: 'education',
    title: 'Education',
    enabled: true,
    repeating: true,
    fields: [
    { id: 'eduSchool', name: 'School / University', dataType: 'Text', state: 'Required' },
    { id: 'eduDegree', name: 'Degree / Diploma', dataType: 'Text', state: 'Optional' },
    { id: 'eduField', name: 'Field of Study', dataType: 'Text', state: 'Optional' },
    { id: 'eduStart', name: 'Start Date', dataType: 'Date', state: 'Optional' },
    { id: 'eduEnd', name: 'End Date', dataType: 'Date', state: 'Optional' }]

  },
  {
    id: 'work',
    title: 'Work Experience',
    enabled: true,
    repeating: true,
    fields: [
    { id: 'expTitle', name: 'Job Title', dataType: 'Text', state: 'Required' },
    { id: 'expCompany', name: 'Company Name', dataType: 'Text', state: 'Required' },
    { id: 'expStart', name: 'Start Date', dataType: 'Date', state: 'Optional' },
    { id: 'expEnd', name: 'End Date', dataType: 'Date', state: 'Optional' },
    { id: 'expResp', name: 'Responsibilities', dataType: 'Long text', state: 'Optional' }]

  },
  {
    id: 'skills',
    title: 'Skills',
    enabled: true,
    repeating: true,
    fields: [{ id: 'skill', name: 'Skill', dataType: 'Text', state: 'Optional' }]
  },
  {
    id: 'emergency',
    title: 'Emergency Contacts',
    enabled: true,
    repeating: true,
    fields: [
    { id: 'ecName', name: 'Contact Name', dataType: 'Text', state: 'Required' },
    { id: 'ecNumber', name: 'Contact Number', dataType: 'Phone', state: 'Required' },
    {
      id: 'ecRelationship',
      name: 'Relationship',
      dataType: 'Dropdown',
      state: 'Required',
      options: ['Parent', 'Spouse', 'Sibling', 'Guardian', 'Friend']
    }]

  },
  {
    id: 'bank',
    title: 'Bank Details',
    enabled: true,
    fields: [
    { id: 'accName', name: 'Name of the Account', dataType: 'Text', state: 'Required' },
    {
      id: 'accType',
      name: 'Account Type & Currency',
      dataType: 'Dropdown',
      state: 'Required',
      options: currencyOptions
    },
    {
      id: 'bankName',
      name: 'Bank Name',
      dataType: 'Dropdown',
      state: 'Required',
      options: [
      'Commercial Bank of Ceylon',
      'Sampath Bank',
      'Hatton National Bank',
      'Bank of Ceylon',
      "People's Bank"]

    },
    { id: 'branchName', name: 'Branch Name', dataType: 'Text', state: 'Required' },
    { id: 'accNumber', name: 'Account Number', dataType: 'Number', state: 'Required' },
    { id: 'branchNumber', name: 'Branch Number', dataType: 'Number', state: 'Optional' }]

  },
  {
    id: 'preferences',
    title: 'Preferences',
    enabled: true,
    fields: [
    {
      id: 'tshirt',
      name: 'T-Shirt Size',
      dataType: 'Dropdown',
      state: 'Optional',
      options: tshirtOptions,
      allowOther: true
    },
    {
      id: 'meal',
      name: 'Meal Preference',
      dataType: 'Dropdown',
      state: 'Optional',
      options: mealOptions,
      allowOther: true
    },
    {
      id: 'liquor',
      name: 'Liquor Consumption',
      dataType: 'Dropdown',
      state: 'Optional',
      options: liquorOptions
    }]

  },
  {
    id: 'insurance',
    title: 'Insurance Details',
    enabled: true,
    fields: [],
    conditionalGroups: [
    {
      id: 'parents',
      label: 'Parents',
      condition: 'Single',
      fields: [
      { id: 'fatherName', name: "Father's Name", dataType: 'Text', state: 'Optional' },
      { id: 'fatherDob', name: "Father's Date of Birth", dataType: 'Date', state: 'Optional' },
      { id: 'motherName', name: "Mother's Name", dataType: 'Text', state: 'Optional' },
      { id: 'motherDob', name: "Mother's Date of Birth", dataType: 'Date', state: 'Optional' }]

    },
    {
      id: 'spouse',
      label: 'Spouse & Children',
      condition: 'Married',
      fields: [
      { id: 'spouseName', name: "Spouse's Name", dataType: 'Text', state: 'Required' },
      { id: 'spouseDob', name: "Spouse's Date of Birth", dataType: 'Date', state: 'Optional' }],

      repeating: {
        label: 'Children',
        fields: [
        { id: 'childName', name: "Child's Name", dataType: 'Text', state: 'Optional' },
        { id: 'childDob', name: "Child's Date of Birth", dataType: 'Date', state: 'Optional' }]

      }
    }]

  }];

}

function buildDocuments(): RequiredDocument[] {
  return [
  { id: 'd1', name: 'National Identity Card', type: 'National ID', required: true, multiple: true },
  {
    id: 'd2',
    name: 'Highest Educational Qualification',
    type: 'Educational Certificate',
    required: true,
    multiple: true
  },
  { id: 'd3', name: 'Previous Employment Letter', type: 'Employment Letter', required: false, multiple: true },
  { id: 'd4', name: 'Police Clearance Report', type: 'Police Report', required: true, multiple: false },
  { id: 'd5', name: 'Passport Size Photograph', type: 'Photograph', required: true, multiple: false }];

}

export const seedForms: EmployeeForm[] = [
{
  id: 'frm1',
  code: 'FRM-001',
  name: 'Permanent Employee Onboarding Form',
  employmentType: 'Permanent',
  description:
  'Standard data collection form for permanent staff, covering personal, contact, banking and insurance details.',
  employeeDetailsEnabled: true,
  status: 'Active',
  createdBy: 'Nimal Perera',
  createdOn: '2025-11-04',
  lastModified: '12 Sep 2026, 15:24',
  sections: buildSections(),
  documents: buildDocuments()
},
{
  id: 'frm2',
  code: 'FRM-002',
  name: 'Intern Onboarding Form',
  employmentType: 'Internship',
  description: 'Shortened form for interns. Bank details are collected only for paid internships.',
  employeeDetailsEnabled: true,
  status: 'Active',
  createdBy: 'Dilani Jayawardena',
  createdOn: '2026-01-19',
  lastModified: '04 Sep 2026, 10:08',
  sections: buildSections().map((section) =>
  section.id === 'insurance' || section.id === 'work' ? { ...section, enabled: false } : section
  ),
  documents: buildDocuments().slice(0, 3)
},
{
  id: 'frm3',
  code: 'FRM-003',
  name: 'Contract Employee Form',
  employmentType: 'Contract',
  description: 'Used for fixed-term contracts of six months or more.',
  employeeDetailsEnabled: true,
  status: 'Inactive',
  createdBy: 'Nimal Perera',
  createdOn: '2025-06-27',
  lastModified: '22 Aug 2026, 17:46',
  sections: buildSections().map((section) =>
  section.id === 'preferences' ? { ...section, enabled: false } : section
  ),
  documents: buildDocuments().slice(0, 4)
},
{
  id: 'frm4',
  code: 'FRM-004',
  name: 'Document Verification Form',
  employmentType: 'Consultant',
  description:
  'Documents-only form for external consultants. No employee details are collected, so the portal shows the upload tab alone.',
  employeeDetailsEnabled: false,
  status: 'Active',
  createdBy: 'Amaya Wickramasinghe',
  createdOn: '2026-08-11',
  lastModified: '01 Sep 2026, 09:12',
  sections: buildSections().map((section) => ({ ...section, enabled: false })),
  documents: buildDocuments().slice(0, 2)
}];


export const documentTypes = [
'National ID',
'Passport',
'Educational Certificate',
'Professional Certification',
'Employment Letter',
'Police Report',
'Photograph',
'Other'] as
const;