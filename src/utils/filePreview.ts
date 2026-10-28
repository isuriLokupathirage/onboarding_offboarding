import { sampleFile } from './sampleFile';

export type FileKind = 'image' | 'pdf' | 'word' | 'excel' | 'powerpoint' | 'csv' | 'other';

export function fileKind(name: string): FileKind {
  const extension = name.split('.').pop()?.toLowerCase() ?? '';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(extension)) return 'image';
  if (extension === 'pdf') return 'pdf';
  if (['doc', 'docx'].includes(extension)) return 'word';
  if (['xls', 'xlsx'].includes(extension)) return 'excel';
  if (['ppt', 'pptx'].includes(extension)) return 'powerpoint';
  if (extension === 'csv') return 'csv';
  return 'other';
}

/** Images and PDFs open in a browser tab. Everything else is downloaded for the user to open. */
export function opensInTab(name: string): boolean {
  const kind = fileKind(name);
  return kind === 'image' || kind === 'pdf';
}

/**
 * Uploads are tracked by file name across the prototype, so the picked File is kept here,
 * keyed by name. Picking a file with the same name again replaces the earlier one.
 * Nothing leaves the browser and the store is cleared on reload.
 */
const pickedFiles = new Map<string, File>();

export function rememberFiles(files: Iterable<File>): void {
  for (const file of files) pickedFiles.set(file.name, file);
}

export function pickedFile(name: string): File | undefined {
  return pickedFiles.get(name);
}

export interface PreviewSource {
  blob: Blob;
  downloadName: string;
}

/** The picked file when there is one, otherwise sample content for files seeded without content. */
export function previewSource(name: string, context: string, size = 'Unknown'): PreviewSource {
  const file = pickedFile(name);
  if (file) return { blob: file, downloadName: file.name };
  return sampleFile({ id: name, name, size }, context);
}

/** Checks the content really is the type its name says, so a broken file is reported, not opened. */
export async function canOpen(source: PreviewSource, name: string): Promise<boolean> {
  if (source.blob.size === 0) return false;
  const kind = fileKind(name);
  try {
    if (kind === 'pdf') {
      return (await source.blob.slice(0, 5).text()) === '%PDF-';
    }
    if (kind === 'image') {
      const bitmap = await createImageBitmap(source.blob);
      bitmap.close();
    }
    return true;
  } catch {
    return false;
  }
}
