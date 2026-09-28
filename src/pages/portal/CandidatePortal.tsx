import React, { useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { CalendarOffIcon, LinkIcon, ShieldOffIcon } from 'lucide-react';
import { PortalShell, type PortalTab } from '../../components/portal/PortalShell';
import { PortalMessage } from '../../components/portal/PortalMessage';
import { formHasFields } from '../../components/forms/CandidateFormRenderer';
import { PortalDataForm } from './PortalDataForm';
import { PortalDocuments } from './PortalDocuments';
import { PortalEvents } from './PortalEvents';
import { useAppData } from '../../contexts/AppDataContext';
import { formatDate } from '../../utils/format';
import { useScreenInit } from '../../useScreenInit.js';

export function PortalEntry() {
  const { transitions } = useAppData();
  const active = transitions.find((transition) => transition.portalAccess === 'Active');
  if (!active) return <Navigate to="/onboarding/transitions" replace />;
  return <Navigate to={`/portal/${active.portalToken}`} replace />;
}

export function CandidatePortal({ eventsEmpty = false }: {eventsEmpty?: boolean;}) {
  const { token } = useParams();
  const { transitions, forms } = useAppData();

  const transition = transitions.find((item) => item.portalToken === token);
  const form = forms.find((item) => item.id === transition?.candidate.employeeFormId);

  const tabs = useMemo<PortalTab[]>(() => {
    const list: PortalTab[] = [];
    if (form && formHasFields(form)) list.push({ value: 'form', label: 'Employee Data Form' });
    if (form && form.documents.length > 0)
    list.push({ value: 'documents', label: 'Required Documents' });
    list.push({ value: 'events', label: 'My Events' });
    return list;
  }, [form]);

  const screenInit = useScreenInit();
  const [tab, setTab] = useState<string>(() => screenInit.tab ?? tabs[0]?.value ?? 'events');

  if (!transition) {
    return (
      <PortalMessage
        icon={LinkIcon}
        title="This link is not valid"
        body="The link you followed does not match an onboarding we have on record. It may have been mistyped or replaced by a newer one." />);


  }

  const candidateName = `${transition.candidate.firstName} ${transition.candidate.lastName}`;
  const expired =
  transition.portalAccess === 'Expired' ||
  new Date(transition.portalExpiresAt).getTime() < Date.now();

  if (transition.portalAccess === 'Revoked') {
    return (
      <PortalMessage
        icon={ShieldOffIcon}
        tone="red"
        recipientName={candidateName}
        title="This link is no longer available"
        body="Your access to this portal was withdrawn, so the form can no longer be opened." />);


  }

  if (expired) {
    return (
      <PortalMessage
        icon={CalendarOffIcon}
        recipientName={candidateName}
        title="This link has expired"
        body={`The portal closed on ${formatDate(
          transition.portalExpiresAt
        )}. A new link can be issued for you.`} />);


  }

  if (transition.status === 'Completed' || transition.status === 'Cancelled') {
    return (
      <PortalMessage
        icon={ShieldOffIcon}
        recipientName={candidateName}
        title="This link is no longer available"
        body={`Your ${transition.kind.toLowerCase()} has been ${transition.status.toLowerCase()}, so the portal is now closed.`} />);


  }

  const activeTab = tabs.some((item) => item.value === tab) ? tab : tabs[0]?.value ?? 'events';

  return (
    <PortalShell
      illustration
      greeting={`Welcome, ${transition.candidate.firstName}`}
      recipientName={`Your ${transition.kind.toLowerCase()} with Accxis Holdings`}
      subtitle={`${transition.candidate.position} · Starting ${formatDate(
        transition.candidate.hireDate
      )}`}
      expiresAt={transition.portalExpiresAt}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setTab}>
      
      {activeTab === 'form' && form && <PortalDataForm form={form} />}
      {activeTab === 'documents' && form && <PortalDocuments form={form} />}
      {activeTab === 'events' && <PortalEvents empty={eventsEmpty} />}
    </PortalShell>);

}