import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  computed,
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
  private pendingViewportAnchor: { left: number; top: number } | 'top' | null =
    null;
  private activePointerId: number | null = null;
  private pointerStartX = 0;
  private pointerStartY = 0;
  private pointerStartScrollLeft = 0;
  private pointerStartScrollTop = 0;

  readonly preview = input<IPdfPreviewDialogValue | null>(null);
  readonly closed = output<void>();

  readonly document = signal<PDFDocumentProxy | null>(null);
  readonly pageNumber = signal(1);
  readonly pageCount = signal(0);
  readonly zoom = signal(1);
  readonly isLoading = signal(false);
  readonly hasError = signal(false);
  readonly isPanning = signal(false);
  readonly canGoPrevious = computed(() => this.pageNumber() > 1);
  readonly canGoNext = computed(() => this.pageNumber() < this.pageCount());
  readonly canZoomOut = computed(() => this.zoom() > 0.5);
  readonly zoomLabel = computed(() => `${(this.zoom() * 100).toFixed(0)}%`);
  readonly canPan = computed(() => {
    const viewport = this.viewport()?.nativeElement;
    const canvas = this.canvas()?.nativeElement;

    if (this.zoom() > 1) {
      return true;
    }

    if (!viewport || !canvas) {
      return false;
    }

    return (
      canvas.width > viewport.clientWidth - 32 ||
      canvas.height > viewport.clientHeight - 32
    );
  });
  readonly canShowControls = computed(
    () => !this.hasError() && (!!this.document() || this.isLoading()),
  );
  readonly renderRequest = computed(() => {
    const document = this.document();
    const canvasRef = this.canvas();
    const viewportRef = this.viewport();

    if (
      !isPlatformBrowser(this.platformId) ||
      !document ||
      !canvasRef ||
      !viewportRef
    ) {
      return null;
    }

    return {
      document,
      canvas: canvasRef.nativeElement,
      viewport: viewportRef.nativeElement,
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
          this.pendingViewportAnchor = 'top';
          this.clearPointerPan();

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
          queueMicrotask(() => this.applyPendingViewportAnchor());
        },
        error: () => {
          this.hasError.set(true);
          this.isLoading.set(false);
        },
      });
  }

  previousPage(): void {
    if (!this.canGoPrevious()) {
      return;
    }

    this.pendingViewportAnchor = 'top';
    this.pageNumber.update((value) => value - 1);
  }

  nextPage(): void {
    if (!this.canGoNext()) {
      return;
    }

    this.pendingViewportAnchor = 'top';
    this.pageNumber.update((value) => value + 1);
  }

  zoomOut(): void {
    if (!this.canZoomOut()) {
      return;
    }

    this.rememberViewportCenter();
    this.zoom.update((value) => Math.max(0.5, +(value - 0.25).toFixed(2)));
  }

  zoomIn(): void {
    this.rememberViewportCenter();
    this.zoom.update((value) => Math.min(3, +(value + 0.25).toFixed(2)));
  }

  resetZoom(): void {
    this.pendingViewportAnchor = 'top';
    this.zoom.set(1);
  }

  onViewportPointerDown(event: PointerEvent): void {
    const viewport = this.viewport()?.nativeElement;

    if (!viewport || !this.canPan() || event.button !== 0) {
      return;
    }

    this.activePointerId = event.pointerId;
    this.pointerStartX = event.clientX;
    this.pointerStartY = event.clientY;
    this.pointerStartScrollLeft = viewport.scrollLeft;
    this.pointerStartScrollTop = viewport.scrollTop;
    this.isPanning.set(true);
    viewport.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  onViewportPointerMove(event: PointerEvent): void {
    const viewport = this.viewport()?.nativeElement;

    if (!viewport || this.activePointerId !== event.pointerId) {
      return;
    }

    viewport.scrollLeft =
      this.pointerStartScrollLeft - (event.clientX - this.pointerStartX);
    viewport.scrollTop =
      this.pointerStartScrollTop - (event.clientY - this.pointerStartY);
    event.preventDefault();
  }

  onViewportPointerUp(event: PointerEvent): void {
    const viewport = this.viewport()?.nativeElement;

    if (
      viewport &&
      this.activePointerId === event.pointerId &&
      viewport.hasPointerCapture(event.pointerId)
    ) {
      viewport.releasePointerCapture(event.pointerId);
    }

    this.clearPointerPan();
  }

  close(): void {
    this.clearPointerPan();
    this.closed.emit();
  }

  private rememberViewportCenter(): void {
    const viewport = this.viewport()?.nativeElement;

    if (!viewport) {
      return;
    }

    const maxLeft = Math.max(viewport.scrollWidth - viewport.clientWidth, 0);
    const maxTop = Math.max(viewport.scrollHeight - viewport.clientHeight, 0);

    this.pendingViewportAnchor = {
      left: maxLeft ? viewport.scrollLeft / maxLeft : 0,
      top: maxTop ? viewport.scrollTop / maxTop : 0,
    };
  }

  private applyPendingViewportAnchor(): void {
    const viewport = this.viewport()?.nativeElement;

    if (!viewport || !this.pendingViewportAnchor) {
      return;
    }

    if (this.pendingViewportAnchor === 'top') {
      viewport.scrollTo({ left: 0, top: 0 });
      this.pendingViewportAnchor = null;
      return;
    }

    const maxLeft = Math.max(viewport.scrollWidth - viewport.clientWidth, 0);
    const maxTop = Math.max(viewport.scrollHeight - viewport.clientHeight, 0);

    viewport.scrollTo({
      left: this.pendingViewportAnchor.left * maxLeft,
      top: this.pendingViewportAnchor.top * maxTop,
    });
    this.pendingViewportAnchor = null;
  }

  private clearPointerPan(): void {
    this.activePointerId = null;
    this.isPanning.set(false);
  }
}
