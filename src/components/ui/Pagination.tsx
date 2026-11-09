import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { Button } from './Button';

/** "Showing 1–10 of 24" with previous, numbered and next page buttons, as on the Transitions list. */
export function Pagination({
  page,
  pageSize,
  total,
  onChange,
  className
}: {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
  className?: string;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);
  return (
    <nav aria-label="Pagination" className={twMerge('flex items-center justify-between', className)}>
      <p className="text-[12px] text-muted">
        Showing {first}–{last} of {total}
      </p>
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
          aria-label="Previous page">

          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
        {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) =>
        <Button
          key={number}
          size="sm"
          variant={number === page ? 'primary' : 'ghost'}
          aria-current={number === page ? 'page' : undefined}
          onClick={() => onChange(number)}
          className="w-8 px-0">

            {number}
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          disabled={page === pageCount}
          onClick={() => onChange(page + 1)}
          aria-label="Next page">

          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </div>
    </nav>);

}
