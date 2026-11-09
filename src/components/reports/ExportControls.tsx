import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDownIcon, DownloadIcon, FileSpreadsheetIcon, FileTextIcon, HistoryIcon, XIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { Drawer } from '../ui/Drawer';
import type { ReportExportRecord } from '../../types';
import type { ExportFormat } from '../../utils/reportFiles';
import { formatDate } from '../../utils/format';

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

const formatTime = (iso: string) => iso.slice(11, 16);

/** The Reports audit trail: who exported which report, when, in which format and with which filters. */
export function ExportHistoryDrawer({
  open,
  onClose,
  records
}: {
  open: boolean;
  onClose: () => void;
  records: ReportExportRecord[];
}) {
  return (
    <Drawer open={open} label="Export history" onClose={onClose}>
      <div className="flex items-start justify-between gap-3 border-b border-line px-6 py-5">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-ink">Export history</h2>
          <p className="mt-1 text-[13px] text-muted">Every report export, with who exported it and when.</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-lg p-1.5 text-subtle transition-colors duration-150 ease-out hover:bg-slate-100 hover:text-ink">

          <XIcon className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {records.length === 0 ?
        <p className="py-8 text-center text-[13px] text-muted">No reports have been exported yet.</p> :

        <ol className="space-y-3">
            {records.map((record) =>
          <li key={record.id} className="rounded-lg border border-line px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[13px] font-medium text-ink">
                    {record.report} · {record.format}
                  </p>
                  <span className="shrink-0 text-[12px] text-muted">
                    {formatDate(record.at.slice(0, 10))}, {formatTime(record.at)}
                  </span>
                </div>
                <p className="mt-0.5 text-[12px] text-muted">Exported by {record.actor}</p>
                <p className="mt-1.5 text-[12px] text-ink">Period: {record.period}</p>
                <p className="text-[12px] text-muted">
                  Filters: {record.filters.length === 0 ? 'None' : record.filters.join('; ')}
                </p>
              </li>
          )}
          </ol>
        }
      </div>
    </Drawer>);

}

/** Opens the export history. */
export function ExportHistoryButton({ onClick }: {onClick: () => void;}) {
  return (
    <Button size="sm" variant="secondary" onClick={onClick} className="inline-flex items-center gap-1.5">
      <HistoryIcon className="h-4 w-4" />
      Export history
    </Button>);

}
