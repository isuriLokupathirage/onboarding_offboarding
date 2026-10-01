import { useEffect, useMemo, useState } from 'react';
import { ChevronDownIcon, DownloadIcon, FileTextIcon } from 'lucide-react';
import type { TaskFile } from '../../types';
import { isPdf, sampleFile } from '../../utils/sampleFile';

/** Files attached to a task: name and size, a download action, and an in-panel preview. */
export function TaskFiles({ files, taskName }: {files: TaskFile[];taskName: string;}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const links = useMemo(
    () =>
    files.map((file) => {
      const { blob, downloadName } = sampleFile(file, taskName);
      return { file, url: URL.createObjectURL(blob), downloadName };
    }),
    [files, taskName]
  );

  useEffect(() => () => links.forEach((link) => URL.revokeObjectURL(link.url)), [links]);

  if (files.length === 0) {
    return <p className="mt-1.5 text-[13px] text-muted">No files are attached to this task.</p>;
  }

  return (
    <ul className="mt-1.5 space-y-2">
      {links.map(({ file, url, downloadName }) => {
        const expanded = expandedId === file.id;
        return (
          <li key={file.id} className="overflow-hidden rounded-lg border border-line bg-white">
            <div className="flex items-center gap-2 px-3 py-2.5">
              <button
                type="button"
                aria-expanded={expanded}
                aria-label={`${expanded ? 'Hide' : 'Show'} preview of ${file.name}`}
                onClick={() => setExpandedId(expanded ? null : file.id)}
                className="flex min-w-0 flex-1 items-center gap-2.5 text-left">

                <FileTextIcon className="h-4 w-4 shrink-0 text-brand-600" />
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block truncate text-[13px] font-medium text-ink">{file.name}</span>
                  <span className="block text-[11px] text-muted">{file.size}</span>
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 text-[12px] text-muted">
                  {expanded ? 'Hide' : 'Preview'}
                  <ChevronDownIcon
                    className={`h-3.5 w-3.5 transition-transform duration-150 ease-out ${
                    expanded ? 'rotate-180' : ''}`
                    } />

                </span>
              </button>
              <a
                href={url}
                download={downloadName}
                aria-label={`Download ${file.name}`}
                title="Download"
                className="shrink-0 rounded-lg p-1.5 text-subtle transition-colors duration-150 ease-out hover:bg-slate-100 hover:text-ink">

                <DownloadIcon className="h-4 w-4" />
              </a>
            </div>

            {expanded && (
            isPdf(file) ?
            <iframe
              title={`Preview of ${file.name}`}
              src={`${url}#toolbar=0&navpanes=0`}
              className="h-80 w-full border-t border-line bg-slate-50" /> :


            <p className="border-t border-line bg-slate-50 px-3 py-6 text-center text-[13px] text-muted">
                A preview is not available for this file type. Download the file to open it.
              </p>)
            }
          </li>);

      })}
    </ul>);

}
