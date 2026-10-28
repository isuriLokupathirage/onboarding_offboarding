import type { TaskFile } from '../../types';
import { FileDownloadButton, FilePreviewButton, FileThumb } from '../ui/FilePreview';
import { opensInTab } from '../../utils/filePreview';

/** Files attached to a task: a thumbnail or file-type icon, name and size, and the preview action. */
export function TaskFiles({
  files,
  taskName,
  downloadable = false




}: {files: TaskFile[];taskName: string;/** Also offer a download for files that open in a tab. */downloadable?: boolean;}) {
  if (files.length === 0) {
    return <p className="mt-1.5 text-[13px] text-muted">No files are attached to this task.</p>;
  }

  return (
    <ul className="mt-1.5 space-y-2">
      {files.map((file) =>
      <li key={file.id} className="flex items-center gap-2.5 rounded-lg border border-line bg-white px-3 py-2.5">
          <FileThumb name={file.name} context={taskName} />
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-[13px] font-medium text-ink">{file.name}</span>
            <span className="block text-[11px] text-muted">{file.size}</span>
          </span>
          <FilePreviewButton name={file.name} context={taskName} fileSize={file.size} />
          {downloadable && opensInTab(file.name) &&
          <FileDownloadButton name={file.name} context={taskName} fileSize={file.size} />
          }
        </li>
      )}
    </ul>);

}
