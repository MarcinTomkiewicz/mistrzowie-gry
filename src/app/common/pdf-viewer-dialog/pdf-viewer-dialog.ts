import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  DestroyRef,
  PLATFORM_ID,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { catchError, distinctUntilChanged, map, of, switchMap } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

import type { PDFDocumentProxy } from 'pdfjs-dist';

import type { IPdfPreview } from '../../core/interfaces/i-pdf';
import { loadPdfDocument, renderPdfPageToCanvas } from '../../core/utils/pdf';
import {
  PDF_VIEWER_ZOOM_MAX,
  PDF_VIEWER_ZOOM_MIN,
} from './pdf-viewer.config';
import { PdfViewerViewport } from './pdf-viewer-viewport';

@Component({
  selector: 'app-pdf-viewer-dialog',
  standalone: true,
  imports: [CommonModule, DialogModule, ButtonModule, PdfViewerViewport],
  templateUrl: './pdf-viewer-dialog.html',
  styleUrl: './pdf-viewer-dialog.scss',
})
export class PdfViewerDialog {
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly viewport = viewChild(PdfViewerViewport);

  readonly preview = input<IPdfPreview | null>(null);
  readonly closed = output<void>();

  readonly document = signal<PDFDocumentProxy | null>(null);
  readonly pageNumber = signal(1);
  readonly pageCount = signal(0);
  readonly zoom = signal(1);
  readonly isLoading = signal(false);
  readonly hasError = signal(false);
  readonly canGoPrevious = computed(() => this.pageNumber() > 1);
  readonly canGoNext = computed(() => this.pageNumber() < this.pageCount());
  readonly canZoomOut = computed(() => this.zoom() > PDF_VIEWER_ZOOM_MIN);
  readonly zoomLabel = computed(() => `${(this.zoom() * 100).toFixed(0)}%`);
  readonly canShowControls = computed(
    () => !!this.document() || this.isLoading(),
  );
  readonly renderRequest = computed(() => {
    const document = this.document();
    const viewport = this.viewport();
    const canvasElement = viewport?.canvasElement();
    const viewportElement = viewport?.viewportElement();

    if (
      !isPlatformBrowser(this.platformId) ||
      !document ||
      !canvasElement ||
      !viewportElement
    ) {
      return null;
    }

    return {
      document,
      canvas: canvasElement,
      viewport: viewportElement,
      pageNumber: this.pageNumber(),
      zoom: this.zoom(),
    };
  });

  constructor() {
    toObservable(this.preview)
      .pipe(
        map((preview) => preview?.url ?? null),
        distinctUntilChanged(),
        switchMap((url) => {
          this.pageNumber.set(1);
          this.zoom.set(1);
          this.viewport()?.resetToTop();
          this.viewport()?.clearInteraction();

          if (!url || !isPlatformBrowser(this.platformId)) {
            this.document.set(null);
            this.pageCount.set(0);
            this.hasError.set(false);
            this.isLoading.set(false);
            return of(null);
          }

          this.isLoading.set(true);
          this.hasError.set(false);

          return loadPdfDocument(url).pipe(
            catchError(() => {
              this.document.set(null);
              this.pageCount.set(0);
              this.hasError.set(true);
              this.isLoading.set(false);
              return of(null);
            }),
          );
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
      });

    toObservable(this.renderRequest)
      .pipe(
        switchMap((request) => {
          if (!request) {
            return of(null);
          }

          this.isLoading.set(true);
          this.hasError.set(false);

          const targetWidth = request.viewport.clientWidth - 32 || 1080;
          const targetHeight = request.viewport.clientHeight - 32 || undefined;

          return renderPdfPageToCanvas(
            request.document,
            request.pageNumber,
            request.canvas,
            targetWidth,
            targetHeight,
            request.zoom,
          ).pipe(
            catchError(() => {
              this.hasError.set(true);
              this.isLoading.set(false);
              return of(null);
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (result) => {
          if (!result) {
            return;
          }

          this.pageCount.set(result.pageCount);
          this.pageNumber.set(result.pageNumber);
          this.isLoading.set(false);
          queueMicrotask(() => this.viewport()?.applyPendingAnchor());
        },
      });
  }

  previousPage(): void {
    if (!this.canGoPrevious()) {
      return;
    }

    this.viewport()?.resetToTop();
    this.pageNumber.update((value) => value - 1);
  }

  nextPage(): void {
    if (!this.canGoNext()) {
      return;
    }

    this.viewport()?.resetToTop();
    this.pageNumber.update((value) => value + 1);
  }

  zoomOut(): void {
    if (!this.canZoomOut()) {
      return;
    }

    this.viewport()?.rememberCenter();
    this.zoom.update((value) =>
      Math.max(PDF_VIEWER_ZOOM_MIN, +(value - 0.25).toFixed(2)),
    );
  }

  zoomIn(): void {
    this.viewport()?.rememberCenter();
    this.zoom.update((value) =>
      Math.min(PDF_VIEWER_ZOOM_MAX, +(value + 0.25).toFixed(2)),
    );
  }

  resetZoom(): void {
    this.viewport()?.resetToTop();
    this.zoom.set(1);
  }

  setZoom(zoom: number): void {
    this.zoom.set(zoom);
  }

  close(): void {
    this.viewport()?.clearInteraction();
    this.closed.emit();
  }
}
