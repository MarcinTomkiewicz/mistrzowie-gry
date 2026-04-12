import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  ElementRef,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

import { renderPdfDocumentToContainer } from '../../../core/utils/pdf';

export interface IPdfPreviewDialogValue {
  title: string;
  url: string;
}

@Component({
  selector: 'app-pdf-viewer-dialog',
  standalone: true,
  imports: [CommonModule, ButtonModule, DialogModule],
  templateUrl: './pdf-viewer-dialog.html',
  styleUrl: './pdf-viewer-dialog.scss',
})
export class PdfViewerDialog {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly pages = viewChild<ElementRef<HTMLDivElement>>('pages');

  readonly preview = input<IPdfPreviewDialogValue | null>(null);
  readonly closed = output<void>();

  readonly pageCount = signal(0);
  readonly isLoading = signal(false);
  readonly hasError = signal(false);
  readonly canRender = computed(
    () =>
      isPlatformBrowser(this.platformId) &&
      !!this.preview()?.url &&
      !!this.pages(),
  );

  constructor() {
    effect(() => {
      if (!this.preview()) {
        return;
      }

      this.pageCount.set(0);
      this.hasError.set(false);
    });

    effect((onCleanup) => {
      if (!this.canRender()) {
        return;
      }

      this.isLoading.set(true);
      this.hasError.set(false);

      const pages = this.pages()!.nativeElement;
      const targetWidth = pages.clientWidth || 1080;

      const subscription = renderPdfDocumentToContainer(
        this.preview()!.url,
        pages,
        targetWidth,
      ).subscribe({
        next: (result) => {
          this.pageCount.set(result.pageCount);
          this.isLoading.set(false);
        },
        error: () => {
          this.hasError.set(true);
          this.isLoading.set(false);
        },
      });

      onCleanup(() => subscription.unsubscribe());
    });
  }

  close(): void {
    this.closed.emit();
  }
}
