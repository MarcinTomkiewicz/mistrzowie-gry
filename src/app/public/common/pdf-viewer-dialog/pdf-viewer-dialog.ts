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

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

import type { PDFDocumentProxy } from 'pdfjs-dist';

import { loadPdfDocument, renderPdfPageToCanvas } from '../../../core/utils/pdf';

const PDF_ZOOM_MIN = 0.5;
const PDF_ZOOM_MAX = 3;

export interface IPdfPreviewDialogValue {
  title: string;
  url: string;
}

interface PointerPosition {
  readonly x: number;
  readonly y: number;
}

interface ViewportAnchor {
  readonly contentLeft: number;
  readonly contentTop: number;
  readonly viewportLeft: number;
  readonly viewportTop: number;
}

interface PinchGesture {
  readonly anchor: ViewportAnchor;
  readonly distance: number;
  readonly zoom: number;
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
  private readonly touchPointers = new Map<number, PointerPosition>();
  private pendingViewportAnchor: ViewportAnchor | 'top' | null = null;
  private pinchGesture: PinchGesture | null = null;
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
  readonly canZoomOut = computed(() => this.zoom() > PDF_ZOOM_MIN);
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
          this.clearPointerInteraction();

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
    this.zoom.update((value) =>
      Math.max(PDF_ZOOM_MIN, +(value - 0.25).toFixed(2)),
    );
  }

  zoomIn(): void {
    this.rememberViewportCenter();
    this.zoom.update((value) =>
      Math.min(PDF_ZOOM_MAX, +(value + 0.25).toFixed(2)),
    );
  }

  resetZoom(): void {
    this.pendingViewportAnchor = 'top';
    this.zoom.set(1);
  }

  onViewportPointerDown(event: PointerEvent): void {
    const viewport = this.viewport()?.nativeElement;

    if (!viewport || event.button !== 0) {
      return;
    }

    if (event.pointerType === 'touch') {
      this.touchPointers.set(event.pointerId, this.pointerPosition(event));
    } else if (!this.canPan()) {
      return;
    }

    viewport.setPointerCapture(event.pointerId);

    if (this.touchPointers.size === 2) {
      this.startPinch(viewport);
    } else if (this.touchPointers.size < 2) {
      this.startPan(viewport, event.pointerId, this.pointerPosition(event));
    }

    event.preventDefault();
  }

  onViewportPointerMove(event: PointerEvent): void {
    const viewport = this.viewport()?.nativeElement;

    if (!viewport) {
      return;
    }

    if (this.touchPointers.has(event.pointerId)) {
      this.touchPointers.set(event.pointerId, this.pointerPosition(event));

      if (this.touchPointers.size >= 2) {
        this.updatePinch(viewport);
        event.preventDefault();
        return;
      }
    }

    if (this.activePointerId !== event.pointerId) return;

    viewport.scrollLeft =
      this.pointerStartScrollLeft - (event.clientX - this.pointerStartX);
    viewport.scrollTop =
      this.pointerStartScrollTop - (event.clientY - this.pointerStartY);
    event.preventDefault();
  }

  onViewportPointerUp(event: PointerEvent): void {
    const viewport = this.viewport()?.nativeElement;

    if (viewport?.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }

    if (!this.touchPointers.delete(event.pointerId)) {
      this.clearPointerPan();
      return;
    }

    this.pinchGesture = null;

    if (!viewport) {
      this.clearPointerInteraction();
      return;
    }

    if (this.touchPointers.size >= 2) {
      this.startPinch(viewport);
      return;
    }

    const remainingPointer = this.touchPointers.entries().next().value;

    if (remainingPointer) {
      this.startPan(viewport, remainingPointer[0], remainingPointer[1]);
    } else {
      this.clearPointerPan();
    }
  }

  close(): void {
    this.clearPointerInteraction();
    this.closed.emit();
  }

  private rememberViewportCenter(): void {
    const viewport = this.viewport()?.nativeElement;
    const canvas = this.canvas()?.nativeElement;

    if (!viewport || !canvas) {
      return;
    }

    this.pendingViewportAnchor = this.createViewportAnchor(
      viewport,
      canvas,
      viewport.clientWidth / 2,
      viewport.clientHeight / 2,
    );
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

    const canvas = this.canvas()?.nativeElement;

    if (!canvas) return;

    viewport.scrollTo({
      left:
        canvas.offsetLeft +
        this.pendingViewportAnchor.contentLeft * canvas.offsetWidth -
        this.pendingViewportAnchor.viewportLeft,
      top:
        canvas.offsetTop +
        this.pendingViewportAnchor.contentTop * canvas.offsetHeight -
        this.pendingViewportAnchor.viewportTop,
    });
    this.pendingViewportAnchor = null;
  }

  private startPan(
    viewport: HTMLDivElement,
    pointerId: number,
    position: PointerPosition,
  ): void {
    if (!this.canPan()) {
      this.clearPointerPan();
      return;
    }

    this.activePointerId = pointerId;
    this.pointerStartX = position.x;
    this.pointerStartY = position.y;
    this.pointerStartScrollLeft = viewport.scrollLeft;
    this.pointerStartScrollTop = viewport.scrollTop;
    this.isPanning.set(true);
  }

  private startPinch(viewport: HTMLDivElement): void {
    const pointers = this.pinchPointers();
    const canvas = this.canvas()?.nativeElement;

    if (!pointers || !canvas) return;

    const center = this.pointerCenter(...pointers);
    const bounds = viewport.getBoundingClientRect();

    this.clearPointerPan();
    this.pinchGesture = {
      anchor: this.createViewportAnchor(
        viewport,
        canvas,
        center.x - bounds.left,
        center.y - bounds.top,
      ),
      distance: this.pointerDistance(...pointers),
      zoom: this.zoom(),
    };
  }

  private updatePinch(viewport: HTMLDivElement): void {
    const pointers = this.pinchPointers();
    const gesture = this.pinchGesture;

    if (!pointers || !gesture || gesture.distance === 0) return;

    const center = this.pointerCenter(...pointers);
    const bounds = viewport.getBoundingClientRect();
    const zoom = Math.min(
      PDF_ZOOM_MAX,
      Math.max(
        PDF_ZOOM_MIN,
        +(
          (gesture.zoom * this.pointerDistance(...pointers)) /
          gesture.distance
        ).toFixed(2),
      ),
    );

    this.pendingViewportAnchor = {
      ...gesture.anchor,
      viewportLeft: center.x - bounds.left,
      viewportTop: center.y - bounds.top,
    };
    this.zoom.set(zoom);
  }

  private createViewportAnchor(
    viewport: HTMLDivElement,
    canvas: HTMLCanvasElement,
    viewportLeft: number,
    viewportTop: number,
  ): ViewportAnchor {
    return {
      contentLeft:
        (viewport.scrollLeft + viewportLeft - canvas.offsetLeft) /
        canvas.offsetWidth,
      contentTop:
        (viewport.scrollTop + viewportTop - canvas.offsetTop) /
        canvas.offsetHeight,
      viewportLeft,
      viewportTop,
    };
  }

  private pinchPointers(): readonly [PointerPosition, PointerPosition] | null {
    const [first, second] = this.touchPointers.values();
    return first && second ? [first, second] : null;
  }

  private pointerPosition(event: PointerEvent): PointerPosition {
    return { x: event.clientX, y: event.clientY };
  }

  private pointerCenter(
    first: PointerPosition,
    second: PointerPosition,
  ): PointerPosition {
    return {
      x: (first.x + second.x) / 2,
      y: (first.y + second.y) / 2,
    };
  }

  private pointerDistance(
    first: PointerPosition,
    second: PointerPosition,
  ): number {
    return Math.hypot(second.x - first.x, second.y - first.y);
  }

  private clearPointerInteraction(): void {
    this.touchPointers.clear();
    this.pinchGesture = null;
    this.clearPointerPan();
  }

  private clearPointerPan(): void {
    this.activePointerId = null;
    this.isPanning.set(false);
  }
}
