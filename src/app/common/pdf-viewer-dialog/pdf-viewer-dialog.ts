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
  type TemplateRef,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { catchError, distinctUntilChanged, filter, map, of, switchMap } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

import type { PDFDocumentProxy } from 'pdfjs-dist';

import type { IPdfPageSurface, IPdfPreview, IPdfPreviewResult } from '../../core/interfaces/i-pdf';
import { createCommonActionsI18n } from '../../core/translations/common.i18n';
import { loadPdfDocument, renderPdfPageToCanvas, reportPdfError } from '../../core/utils/pdf';
import {
  PDF_VIEWER_ZOOM_MAX,
  PDF_VIEWER_ZOOM_MIN,
  PDF_VIEWER_ZOOM_STEP,
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
  private documentLoad?: AbortController;
  private readonly loadedDocument = signal<{ url: string; document: PDFDocumentProxy } | null>(null);

  readonly preview = input<IPdfPreview | null>(null);
  readonly initialPage = input(1);
  readonly panEnabled = input(true);
  readonly overlay = input<TemplateRef<{ $implicit: IPdfPageSurface }> | null>(null);
  readonly toolbar = input<TemplateRef<unknown> | null>(null);
  readonly closed = output<void>();
  readonly previewResult = output<IPdfPreviewResult>();
  protected readonly commonActions = createCommonActionsI18n();

  private readonly previewUrl = computed(() => this.preview()?.url ?? null);
  readonly document = computed(() => this.loadedDocument()?.document ?? null);
  readonly pageNumber = signal(1);
  readonly pageCount = signal(0);
  readonly zoom = signal(1);
  readonly isLoading = signal(false);
  readonly hasError = signal(false);
  protected readonly surface = signal<IPdfPageSurface | null>(null);
  readonly canGoPrevious = computed(() => this.pageNumber() > 1);
  readonly canGoNext = computed(() => this.pageNumber() < this.pageCount());
  readonly canZoomOut = computed(() => this.zoom() > PDF_VIEWER_ZOOM_MIN);
  readonly zoomLabel = computed(() => `${(this.zoom() * 100).toFixed(0)}%`);
  readonly canShowControls = computed(
    () => !!this.document() || this.isLoading(),
  );
  readonly renderRequest = computed(() => {
    const loaded = this.loadedDocument();
    const viewport = this.viewport();
    const canvasElement = viewport?.canvasElement();
    const viewportElement = viewport?.viewportElement();

    if (
      !isPlatformBrowser(this.platformId) ||
      !loaded || loaded.url !== this.previewUrl() ||
      !canvasElement ||
      !viewportElement
    ) {
      return null;
    }

    return {
      ...loaded,
      canvas: canvasElement,
      viewport: viewportElement,
      pageNumber: this.pageNumber(),
      zoom: this.zoom(),
    };
  });

  constructor() {
    this.destroyRef.onDestroy(() => this.documentLoad?.abort());
    toObservable(this.previewUrl)
      .pipe(
        distinctUntilChanged(),
        switchMap((url) => {
          this.documentLoad?.abort();
          this.documentLoad = undefined;
          this.loadedDocument.set(null);
          this.surface.set(null);
          this.pageCount.set(0);
          this.pageNumber.set(1);
          this.zoom.set(1);
          this.viewport()?.resetToTop();
          this.viewport()?.clearInteraction();

          if (!url || !isPlatformBrowser(this.platformId)) {
            this.hasError.set(false);
            this.isLoading.set(false);
            return of(null);
          }

          this.isLoading.set(true);
          this.hasError.set(false);

          const controller = new AbortController();
          this.documentLoad = controller;
          return loadPdfDocument(url, controller.signal).pipe(
            filter(() => this.previewUrl() === url && this.documentLoad === controller),
            map((result) => ({ ...result, url })),
            catchError((error: unknown) => {
              controller.abort();
              if (this.previewUrl() !== url || this.documentLoad !== controller) return of(null);
              reportPdfError('dialog-load', error);
              this.hasError.set(true);
              this.isLoading.set(false);
              this.previewResult.emit({ url, status: 'load-failed' });
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

          this.loadedDocument.set({ url: result.url, document: result.document });
          this.pageCount.set(result.pageCount);
          const initialPage = this.initialPage();
          this.pageNumber.set(Number.isInteger(initialPage) ? Math.max(1, Math.min(initialPage, result.pageCount)) : 1);
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
          this.surface.set(null);
          this.previewResult.emit({ url: request.url, status: 'rendering' });

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
            filter(() => this.renderRequest() === request),
            map((result) => ({ result, request })),
            catchError((error: unknown) => {
              if (this.renderRequest() !== request) return of(null);
              reportPdfError('dialog-render', error);
              this.hasError.set(true);
              this.isLoading.set(false);
              this.previewResult.emit({ url: request.url, status: 'render-failed' });
              return of(null);
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (completed) => {
          if (!completed) {
            return;
          }

          const { result, request } = completed;
          this.pageCount.set(result.pageCount);
          this.pageNumber.set(result.pageNumber);
          this.surface.set(result.surface);
          this.isLoading.set(false);
          this.previewResult.emit({ url: request.url, status: 'rendered' });
          queueMicrotask(() => {
            if (this.renderRequest() === request) this.viewport()?.applyPendingAnchor();
          });
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
      Math.max(PDF_VIEWER_ZOOM_MIN, +(value - PDF_VIEWER_ZOOM_STEP).toFixed(2)),
    );
  }

  zoomIn(): void {
    this.viewport()?.rememberCenter();
    this.zoom.update((value) =>
      Math.min(PDF_VIEWER_ZOOM_MAX, +(value + PDF_VIEWER_ZOOM_STEP).toFixed(2)),
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
