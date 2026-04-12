import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  DestroyRef,
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
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, map, of, switchMap } from 'rxjs';

import { DialogModule } from 'primeng/dialog';

import type { PDFDocumentProxy } from 'pdfjs-dist';

import { loadPdfDocument, renderPdfPageToCanvas } from '../../../core/utils/pdf';
import { ButtonModule } from 'primeng/button';

export interface IPdfPreviewDialogValue {
  title: string;
  url: string;
}

@Component({
  selector: 'app-pdf-viewer-dialog',
  standalone: true,
  imports: [CommonModule, DialogModule, ButtonModule],
  templateUrl: './pdf-viewer-dialog.html',
  styleUrl: './pdf-viewer-dialog.scss',
})
export class PdfViewerDialog {
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly viewport = viewChild<ElementRef<HTMLDivElement>>('viewport');

  readonly preview = input<IPdfPreviewDialogValue | null>(null);
  readonly closed = output<void>();

  readonly document = signal<PDFDocumentProxy | null>(null);
  readonly pageNumber = signal(1);
  readonly pageCount = signal(0);
  readonly zoom = signal(1);
  readonly isLoading = signal(false);
  readonly hasError = signal(false);
  readonly canGoPrevious = computed(() => this.pageNumber() > 1);
  readonly canGoNext = computed(() => this.pageNumber() < this.pageCount());
  readonly canZoomOut = computed(() => this.zoom() > 0.5);
  readonly zoomLabel = computed(() => `${(this.zoom() * 100).toFixed(0)}%`);
  readonly canShowControls = computed(
    () => !this.hasError() && (!!this.document() || this.isLoading()),
  );
  readonly canRender = computed(
    () =>
      isPlatformBrowser(this.platformId) &&
      !!this.document() &&
      !!this.canvas() &&
      !!this.viewport(),
  );

  constructor() {
    effect(() => {
      if (!this.preview()) {
        this.document.set(null);
        this.pageNumber.set(1);
        this.zoom.set(1);
        this.pageCount.set(0);
        return;
      }

      this.hasError.set(false);
      this.pageNumber.set(1);
      this.zoom.set(1);
    });

    toObservable(this.preview)
      .pipe(
        map((preview) => preview?.url ?? null),
        distinctUntilChanged(),
        switchMap((url) => {
          if (!url || !isPlatformBrowser(this.platformId)) {
            this.document.set(null);
            this.pageCount.set(0);
            this.hasError.set(false);
            this.isLoading.set(false);
            return of(null);
          }

          this.isLoading.set(true);
          this.hasError.set(false);

          return loadPdfDocument(url);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (result) => {
          if (!result) {
            return;
          }

          this.document.set(result.document);
          this.pageCount.set(result.pageCount);
          this.pageNumber.set(1);
          this.isLoading.set(false);
        },
        error: () => {
          this.document.set(null);
          this.pageCount.set(0);
          this.hasError.set(true);
          this.isLoading.set(false);
        },
      });

    effect((onCleanup) => {
      if (!this.canRender()) {
        return;
      }

      this.isLoading.set(true);
      this.hasError.set(false);

      const canvas = this.canvas()!.nativeElement;
      const viewport = this.viewport()!.nativeElement;
      const targetWidth = viewport.clientWidth - 32 || 1080;
      const targetHeight = viewport.clientHeight - 32 || undefined;

      const subscription = renderPdfPageToCanvas(
        this.document()!,
        this.pageNumber(),
        canvas,
        targetWidth,
        targetHeight,
        this.zoom(),
      ).subscribe({
        next: (result) => {
          this.pageCount.set(result.pageCount);
          this.pageNumber.set(result.pageNumber);
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

  previousPage(): void {
    if (!this.canGoPrevious()) {
      return;
    }

    this.pageNumber.update((value) => value - 1);
  }

  nextPage(): void {
    if (!this.canGoNext()) {
      return;
    }

    this.pageNumber.update((value) => value + 1);
  }

  zoomOut(): void {
    if (!this.canZoomOut()) {
      return;
    }

    this.zoom.update((value) => Math.max(0.5, +(value - 0.25).toFixed(2)));
  }

  zoomIn(): void {
    this.zoom.update((value) => Math.min(3, +(value + 0.25).toFixed(2)));
  }

  resetZoom(): void {
    this.zoom.set(1);
  }

  close(): void {
    this.closed.emit();
  }
}
