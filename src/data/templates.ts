import type { Template } from '../types';

export const seedTemplates: Template[] = [
{
  id: 'tpl1',
  code: 'ONT-001',
  kind: 'Onboarding',
  name: 'Standard Permanent Onboarding',
  client: 'Accxis Holdings (Pvt) Ltd',
  employmentType: 'Permanent',
  taskIds: ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9', 't14']
},
{
  id: 'tpl2',
  code: 'ONT-002',
  kind: 'Onboarding',
  name: 'Engineering Intern Onboarding',
  client: 'Zenlanka Technologies',
  employmentType: 'Internship',
  taskIds: ['t2', 't4', 't5', 't6', 't11', 't12']
},
{
  id: 'tpl3',
  code: 'ONT-003',
  kind: 'Onboarding',
  name: 'Finance Contract Onboarding',
  client: 'Ceylon Fin Services',
  employmentType: 'Contract',
  taskIds: ['t1', 't2', 't7', 't9', 't10']
},
{
  id: 'tpl4',
  code: 'ONT-004',
  kind: 'Onboarding',
  name: 'Consultant Fast Track',
  client: 'Serendib Logistics',
  employmentType: 'Consultant',
  taskIds: ['t1', 't4', 't6', 't8']
},
{
  id: 'tpl5',
  code: 'OFT-001',
  kind: 'Offboarding',
  name: 'Standard Resignation Offboarding',
  client: 'Accxis Holdings (Pvt) Ltd',
  employmentType: 'Permanent',
  taskIds: ['t20', 't21', 't22', 't23', 't24', 't26']
},
{
  id: 'tpl6',
  code: 'OFT-002',
  kind: 'Offboarding',
  name: 'Contract Completion Offboarding',
  client: 'Ceylon Fin Services',
  employmentType: 'Contract',
  taskIds: ['t20', 't22', 't23', 't24']
},
{
  id: 'tpl7',
  code: 'OFT-003',
  kind: 'Offboarding',
  name: 'Intern Programme Exit',
  client: 'Zenlanka Technologies',
  employmentType: 'Internship',
  taskIds: ['t21', 't22', 't23']
}];