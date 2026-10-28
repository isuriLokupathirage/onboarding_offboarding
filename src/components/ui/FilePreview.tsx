import { useEffect, useMemo, useState } from 'react';
import { DownloadIcon, EyeIcon } from 'lucide-react';
import { Tooltip } from './Tooltip';
import { canOpen, fileKind, opensInTab, pickedFile, previewSource } from '../../utils/filePreview';
import type { FileKind } from '../../utils/filePreview';

/** Word, Excel and PowerPoint get a letter badge, PDF and CSV a label band, as in desktop file managers. */
const KIND_MARK: Partial<Record<FileKind, {style: 'badge' | 'band';text: string;color: string;}>> = {
  word: { style: 'badge', text: 'W', color: '#185ABD' },
  excel: { style: 'badge', text: 'X', color: '#107C41' },
  powerpoint: { style: 'badge', text: 'P', color: '#C43E1C' },
  pdf: { style: 'band', text: 'PDF', color: '#D93025' },
  csv: { style: 'band', text: 'CSV', color: '#0E7C66' }
};

function FileTypeIcon({ kind, className }: {kind: FileKind;className: string;}) {
  const mark = KIND_MARK[kind];
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={`${className} shrink-0`}>
      <path d="M8 1.5h11.5L27 9v19.5a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-25a2 2 0 0 1 2-2z" fill="#fff" stroke="#CBD5E1" />
      <path d="M19.5 1.5V7a2 2 0 0 0 2 2H27" fill="#EEF2F6" stroke="#CBD5E1" strokeLinejoin="round" />
      {mark?.style !== 'badge' ?
      <path d="M10 10.5h6M10 13.5h13M10 16.5h13" stroke="#E2E8F0" strokeWidth="1.4" strokeLinecap="round" /> :
      <path d="M18 14h6M18 17.5h6M18 21h6M18 24.5h6" stroke="#E2E8F0" strokeWidth="1.4" strokeLinecap="round" />
      }
      {mark?.style === 'badge' &&
      <>
          <rect x="2" y="13" width="15" height="15" rx="2.5" fill={mark.color} />
          <text x="9.5" y="24.2" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff" fontFamily="Inter, Arial, sans-serif">
            {mark.text}
          </text>
        </>
      }
      {mark?.style === 'band' &&
      <>
          <rect x="3" y="19" width="26" height="9" rx="1.5" fill={mark.color} />
          <text x="16" y="26" textAnchor="middle" fontSize="7" fontWeight="700" fill="#fff" fontFamily="Inter, Arial, sans-serif" letterSpacing="0.3">
            {mark.text}
          </text>
        </>
      }
    </svg>);

}

/** A thumbnail for an image file, or a file-type icon for anything else. */
export function FileThumb({
  name,
  context,
  size = 'md'




}: {name: string;context: string;size?: 'sm' | 'md';}) {
  const kind = fileKind(name);
  const [broken, setBroken] = useState(false);
  // A replacement file with the same name is a new File, so the thumbnail follows it.
  const picked = pickedFile(name);
  // Only sample content depends on the context, so typing a task name does not reload a real image.
  const sampleContext = picked ? null : context;

  const url = useMemo(() => {
    if (kind !== 'image') return null;
    return URL.createObjectURL(picked ?? previewSource(name, sampleContext ?? '').blob);
  }, [kind, name, picked, sampleContext]);
  useEffect(() => {
    setBroken(false);
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  const box = size === 'sm' ? 'h-7 w-7' : 'h-9 w-9';

  if (url && !broken) {
    return (
      <img
        src={url}
        alt=""
        onError={() => setBroken(true)}
        className={`${box} shrink-0 rounded-md object-cover ring-1 ring-inset ring-line`} />);


  }

  // A broken image falls back to the plain page icon.
  return <FileTypeIcon kind={kind === 'image' ? 'other' : kind} className={box} />;

}

/**
 * The file action. Images and PDFs show an eye and open in a new tab; Word, Excel, PowerPoint
 * and CSV files show a download icon and are downloaded, because browsers cannot display them.
 * It is a real link, so browsers do not treat it as a popup. Previewing never changes the upload list.
 */
export function FilePreviewButton({
  name,
  context,
  fileSize




}: {name: string;context: string;fileSize?: string;}) {
  const inTab = opensInTab(name);
  const label = inTab ? 'Open' : 'Download to view';
  const picked = pickedFile(name);
  const [openable, setOpenable] = useState(true);
  const [failed, setFailed] = useState(false);

  const source = useMemo(
    () => picked ? { blob: picked, downloadName: picked.name } : previewSource(name, context, fileSize),
    [picked, name, context, fileSize]
  );
  const url = useMemo(() => URL.createObjectURL(source.blob), [source]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  // Checked ahead of the click, so a broken file shows a message instead of an empty tab.
  useEffect(() => {
    let active = true;
    setFailed(false);
    void canOpen(source, name).then((ok) => {
      if (active) setOpenable(ok);
    });
    return () => {
      active = false;
    };
  }, [source, name]);

  useEffect(() => {
    if (!failed) return;
    const timer = setTimeout(() => setFailed(false), 5000);
    return () => clearTimeout(timer);
  }, [failed]);

  return (
    <span className="inline-flex shrink-0 items-center gap-1.5">
      {failed &&
      <span role="alert" className="text-[11px] text-red-600">
          This file cannot be previewed.
        </span>
      }
      <Tooltip label={label}>
        <a
          href={url}
          aria-label={`${label}: ${name}`}
          {...inTab ? { target: '_blank', rel: 'noopener noreferrer' } : { download: source.downloadName }}
          onClick={(event) => {
            event.stopPropagation();
            if (openable) return;
            event.preventDefault();
            setFailed(true);
          }}
          className="rounded p-1 text-subtle transition-colors duration-150 ease-out hover:bg-slate-200 hover:text-ink">

          {inTab ? <EyeIcon className="h-3.5 w-3.5" /> : <DownloadIcon className="h-3.5 w-3.5" />}
        </a>
      </Tooltip>
    </span>);

}
/** Always downloads the file, whatever its type. Used next to the preview action. */
export function FileDownloadButton({
  name,
  context,
  fileSize




}: {name: string;context: string;fileSize?: string;}) {
  const picked = pickedFile(name);
  const source = useMemo(
    () => picked ? { blob: picked, downloadName: picked.name } : previewSource(name, context, fileSize),
    [picked, name, context, fileSize]
  );
  const url = useMemo(() => URL.createObjectURL(source.blob), [source]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  return (
    <Tooltip label="Download">
      <a
        href={url}
        download={source.downloadName}
        aria-label={`Download: ${name}`}
        onClick={(event) => event.stopPropagation()}
        className="rounded p-1 text-subtle transition-colors duration-150 ease-out hover:bg-slate-200 hover:text-ink">

        <DownloadIcon className="h-3.5 w-3.5" />
      </a>
    </Tooltip>);

}
