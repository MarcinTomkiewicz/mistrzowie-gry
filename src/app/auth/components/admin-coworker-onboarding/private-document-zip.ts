import { signal } from '@angular/core';
import { firstValueFrom, fromEvent, takeUntil, type Observable } from 'rxjs';

import { environment } from '../../../../env/environment';
import type { ICoworkerDocumentDownload } from '../../../core/interfaces/i-coworker-onboarding';
import type { Platform } from '../../../core/services/platform/platform';

export interface PrivateDocumentZipProgress {
  readonly completed: number;
  readonly total: number;
}

export class PrivateDocumentZip {
  private readonly state = signal<PrivateDocumentZipProgress | null>(null);
  private active: AbortController | null = null;
  readonly progress = this.state.asReadonly();

  constructor(private readonly platform: Platform) {}

  async download(
    ids: readonly string[],
    getDownload: (id: string) => Observable<ICoworkerDocumentDownload>,
    filename: string,
  ): Promise<void> {
    if (!this.platform.isBrowser || this.active || ids.length === 0) return;

    const controller = new AbortController();
    const { signal } = controller;
    this.active = controller;
    this.state.set({ completed: 0, total: ids.length });
    try {
      const { BlobReader, BlobWriter, ZipWriter } = await import('@zip.js/zip.js');
      signal.throwIfAborted();
      const writer = new ZipWriter(new BlobWriter('application/zip'), { level: 0, useWebWorkers: false });
      const aborted = fromEvent(signal, 'abort');
      try {
        for (const [index, id] of ids.entries()) {
          signal.throwIfAborted();
          const download = await firstValueFrom(getDownload(id).pipe(takeUntil(aborted)));
          signal.throwIfAborted();
          const pdf = await fetchPdf(download.url, signal);
          await writer.add(archiveEntryName(download.filename, index), new BlobReader(pdf), { signal });
          signal.throwIfAborted();
          this.state.set({ completed: index + 1, total: ids.length });
        }
      } catch (error) {
        await writer.close().catch(() => undefined);
        throw error;
      }
      const blob = await writer.close();
      signal.throwIfAborted();
      this.platform.downloadBlob(blob, filename);
    } catch (error) {
      if (!signal.aborted) throw error;
    } finally {
      if (this.active === controller) {
        this.active = null;
        this.state.set(null);
      }
    }
  }

  cancel(): void {
    this.active?.abort();
    this.active = null;
    this.state.set(null);
  }
}

async function fetchPdf(signedUrl: string, signal: AbortSignal): Promise<Blob> {
  const url = new URL(signedUrl);
  const storage = new URL('/storage/v1/object/sign/coworker-documents/', environment.supabase.url);
  if (url.origin !== storage.origin || !url.pathname.startsWith(storage.pathname) ||
      url.username || url.password || !url.searchParams.get('token')) {
    throw new Error('Invalid private document download URL.');
  }

  const response = await fetch(url, { signal, credentials: 'omit', redirect: 'error', referrerPolicy: 'no-referrer' });
  if (response.status !== 200) {
    await response.body?.cancel();
    throw new Error('Private document download failed.');
  }
  const pdf = await response.blob();
  if (await pdf.slice(0, 5).text() !== '%PDF-') {
    throw new Error('Invalid private document PDF.');
  }
  return pdf;
}

function archiveEntryName(filename: string, index: number): string {
  const basename = filename.split(/[/\\]/).at(-1) ?? '';
  const stem = basename.replace(/\.pdf$/i, '').normalize('NFKC')
    .replace(/[^\p{L}\p{N} ._-]/gu, '_').slice(0, 96).replace(/^[. ]+|[. ]+$/g, '');
  return `${index + 1}-${stem || 'dokument'}.pdf`;
}
