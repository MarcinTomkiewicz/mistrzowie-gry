import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  ElementRef,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';

import { renderPdfPageToCanvas } from '../../../core/utils/pdf';

@Component({
  selector: 'app-pdf-thumbnail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pdf-thumbnail.html',
  styleUrl: './pdf-thumbnail.scss',
})
export class PdfThumbnail {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');

  readonly src = input<string | null>(null);
  readonly title = input('');
  readonly targetWidth = input(320);

  readonly isLoading = signal(false);
  readonly hasError = signal(false);
  readonly canRender = computed(
    () =>
      isPlatformBrowser(this.platformId) &&
      !!this.src() &&
      !!this.canvas(),
  );

  constructor() {
    effect((onCleanup) => {
      if (!this.canRender()) {
        return;
      }

      this.isLoading.set(true);
      this.hasError.set(false);

      const subscription = renderPdfPageToCanvas(
        this.src()!,
        1,
        this.canvas()!.nativeElement,
        this.targetWidth(),
      ).subscribe({
        next: () => {
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
          this.hasError.set(true);
        },
      });

      onCleanup(() => subscription.unsubscribe());
    });
  }
}
