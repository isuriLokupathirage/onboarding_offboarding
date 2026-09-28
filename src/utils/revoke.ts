/**
 * Success message after a revoke, e.g. "Access revoked. Dasuni's links to A and B no longer work."
 * Mentions any form that closed before it could be revoked.
 */
export function revokeNotice(firstName: string, revoked: string[], skipped: string[]): string {
  const done =
  revoked.length > 1 ?
  `Access revoked. ${firstName}'s links to ${joinNames(revoked)} no longer work.` :
  `Access revoked. ${firstName}'s link to ${revoked[0]} no longer works.`;
  if (skipped.length === 0) return done;
  return `${done} ${joinNames(skipped)} ${skipped.length > 1 ? 'were' : 'was'} already closed, so ${
  skipped.length > 1 ? 'they were' : 'it was'} left unchanged.`;
}

/** "A", "A and B", "A, B and C" */
export function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}
