import { signal } from '@angular/core';
import { firstValueFrom, fromEvent, takeUntil, type Observable } from 'rxjs';

import type { ICoworkerDocumentDownload } from '../../../core/interfaces/i-coworker-onboarding';
import type { Platform } from '../../../core/services/platform/platform';
import { fetchPrivatePdf } from '../../../core/utils/private-pdf';

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
          const pdf = await fetchPrivatePdf(download.url, '/storage/v1/object/sign/coworker-documents/', signal);
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

function archiveEntryName(filename: string, index: number): string {
  const basename = filename.split(/[/\\]/).at(-1) ?? '';
  const stem = basename.replace(/\.pdf$/i, '').normalize('NFKC')
    .replace(/[^\p{L}\p{N} ._-]/gu, '_').slice(0, 96).replace(/^[. ]+|[. ]+$/g, '');
  return `${index + 1}-${stem || 'dokument'}.pdf`;
}
