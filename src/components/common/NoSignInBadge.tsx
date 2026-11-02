import { KeyRoundIcon } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

export const NO_SIGN_IN_NOTE = 'will be notified by email but cannot open or update the task in the system.';

/** Shown next to an employee who has no login to the system. */
export function NoSignInBadge({ className }: {className?: string;}) {
  return (
    <span
      title="This employee has no login, so they get email notifications only."
      className={twMerge(
        'inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 ring-1 ring-inset ring-amber-200',
        className
      )}>

      <KeyRoundIcon className="h-2.5 w-2.5" aria-hidden />
      No sign-in access
    </span>);

}
