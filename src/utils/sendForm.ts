import type { TransitionFormSend } from '../contexts/AppDataContext';
import type { Transition } from '../types';

/** The toast after Send Form: what went out, to whom, and how many candidates got a new portal link. */
export function sendFormNotice(
sends: TransitionFormSend[],
formNames: string[],
recipients: Transition[])
: string {
  const what = formNames.length === 1 ? formNames[0] : `${formNames.length} forms`;
  const portals = sends.filter((send) => send.newPortal).length;
  if (sends.length === 1) {
    const email = recipients.find((transition) => transition.id === sends[0].transitionId)?.candidate.personalEmail;
    const sent = sends[0].formIds.length === formNames.length ? what : `${sends[0].formIds.length} of the forms`;
    return `${sent} ${sends[0].formIds.length === 1 ? 'was' : 'were'} sent to ${email}.${
    portals ? ' A new portal link was issued.' : ''}`;
  }
  return `${what} ${formNames.length === 1 ? 'was' : 'were'} sent to ${sends.length} candidates at their personal email addresses.${
  portals ? ` ${portals} received a new portal link.` : ''}`;
}
