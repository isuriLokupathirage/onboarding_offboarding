import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDownIcon, DownloadIcon, FileSpreadsheetIcon, FileTextIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import type { ExportFormat } from '../../utils/reportFiles';

const FORMATS: {format: ExportFormat;label: string;hint: string;Icon: typeof FileTextIcon;}[] = [
{ format: 'Excel', label: 'Excel (.xlsx)', hint: 'Figures, chart totals and every table row', Icon: FileSpreadsheetIcon },
{ format: 'PDF', label: 'PDF', hint: 'Figures, chart totals and the table, ready to share', Icon: FileTextIcon }];


/** The Export button and its Excel / PDF choices. Disabled, with a reason, when there is nothing to export. */
export function ExportMenu({
  onExport,
  disabledReason
}: {
  onExport: (format: ExportFormat) => void;
  disabledReason?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <Button
        size="sm"
        variant="primary"
        disabled={Boolean(disabledReason)}
        title={disabledReason}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5">

        <DownloadIcon className="h-4 w-4" />
        Export
        <ChevronDownIcon className="h-3.5 w-3.5" />
      </Button>
      <AnimatePresence>
        {open &&
        <motion.div
          role="menu"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.14, ease: [0.23, 1, 0.32, 1] }}
          className="absolute right-0 z-40 mt-1.5 w-72 rounded-xl border border-line bg-white p-1 shadow-pop">

            {FORMATS.map(({ format, label, hint, Icon }) =>
          <button
            key={format}
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onExport(format);
            }}
            className="flex w-full items-start gap-2.5 rounded-lg px-3 py-2 text-left transition-colors duration-150 ease-out hover:bg-slate-50">

                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-subtle" />
                <span>
                  <span className="block text-[13px] font-medium text-ink">{label}</span>
                  <span className="block text-[12px] text-muted">{hint}</span>
                </span>
              </button>
          )}
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}
