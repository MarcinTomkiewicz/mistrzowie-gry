import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  ElementRef,
  PLATFORM_ID,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';

import { renderPdfPageToCanvas, reportPdfError } from '../../core/utils/pdf';

@Component({
  selector: 'app-pdf-thumbnail',
  templateUrl: './pdf-thumbnail.html',
  styleUrl: './pdf-thumbnail.scss',
})
export class PdfThumbnail {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');

  readonly src = input<string | File | null>(null);
  readonly title = input('');
  readonly targetWidth = input(320);

  readonly isLoading = signal(false);
  readonly hasError = signal(false);

  constructor() {
    effect((onCleanup) => {
      const source = this.src();
      const canvas = this.canvas()?.nativeElement;
      if (!isPlatformBrowser(this.platformId) || !source || !canvas) {
        return;
      }

      const url = typeof source === 'string' ? source : URL.createObjectURL(source);
      this.isLoading.set(true);
      this.hasError.set(false);

      const subscription = renderPdfPageToCanvas(
        url,
        1,
        canvas,
        this.targetWidth(),
      ).subscribe({
        next: () => {
          this.isLoading.set(false);
        },
        error: (error: unknown) => {
          reportPdfError('thumbnail', error);
          this.isLoading.set(false);
          this.hasError.set(true);
        },
      });

      onCleanup(() => {
        subscription.unsubscribe();
        if (typeof source !== 'string') URL.revokeObjectURL(url);
      });
    });
  }
}
