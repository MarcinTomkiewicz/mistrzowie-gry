import { Component, ElementRef, computed, input, output, signal, viewChild } from '@angular/core';

import type {
  IPdfPinchGesture,
  IPdfPointerPosition,
  IPdfViewportAnchor,
} from '../../core/interfaces/i-pdf';
import {
  PDF_VIEWER_ZOOM_MAX,
  PDF_VIEWER_ZOOM_MIN,
} from './pdf-viewer.config';

@Component({
  selector: 'app-pdf-viewer-viewport',
  templateUrl: './pdf-viewer-viewport.html',
  styleUrl: './pdf-viewer-viewport.scss',
})
export class PdfViewerViewport {
  readonly zoom = input.required<number>();
  readonly zoomChange = output<number>();

  private readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>(
    'canvas',
  );
  private readonly viewportRef = viewChild<ElementRef<HTMLDivElement>>(
    'viewport',
  );
  private readonly touchPointers = new Map<number, IPdfPointerPosition>();
  private pendingAnchor: IPdfViewportAnchor | 'top' | null = null;
  private pinchGesture: IPdfPinchGesture | null = null;
  private activePointerId: number | null = null;
  private pointerStartX = 0;
  private pointerStartY = 0;
  private pointerStartScrollLeft = 0;
  private pointerStartScrollTop = 0;

  protected readonly isPanning = signal(false);
  protected readonly canPan = computed(() => {
    const viewport = this.viewportElement();
    const canvas = this.canvasElement();

    if (!viewport || !canvas) return false;

    return this.zoom() > 1 ||
      canvas.width > viewport.clientWidth - 32 ||
      canvas.height > viewport.clientHeight - 32;
  });

  canvasElement(): HTMLCanvasElement | null {
    return this.canvasRef()?.nativeElement ?? null;
  }

  viewportElement(): HTMLDivElement | null {
    return this.viewportRef()?.nativeElement ?? null;
  }

  rememberCenter(): void {
    const viewport = this.viewportElement();
    const canvas = this.canvasElement();
    if (!viewport || !canvas) return;

    this.pendingAnchor = this.createAnchor(
      viewport,
      canvas,
      viewport.clientWidth / 2,
      viewport.clientHeight / 2,
    );
  }

  resetToTop(): void {
    this.pendingAnchor = 'top';
  }

  applyPendingAnchor(): void {
    const anchor = this.pendingAnchor;
    if (!anchor) return;

    const viewport = this.viewportElement();
    if (!viewport) return;
    if (anchor === 'top') {
      viewport.scrollTo({ left: 0, top: 0 });
      this.pendingAnchor = null;
      return;
    }

    const canvas = this.canvasElement();
    if (!canvas) return;
    viewport.scrollTo({
      left:
        canvas.offsetLeft +
        anchor.contentLeft * canvas.offsetWidth -
        anchor.viewportLeft,
      top:
        canvas.offsetTop +
        anchor.contentTop * canvas.offsetHeight -
        anchor.viewportTop,
    });
    this.pendingAnchor = null;
  }

  clearInteraction(): void {
    this.touchPointers.clear();
    this.pinchGesture = null;
    this.clearPointerPan();
  }

  protected onPointerDown(event: PointerEvent): void {
    const viewport = this.viewportElement();
    if (!viewport || event.button !== 0) return;

    if (event.pointerType === 'touch') {
      this.touchPointers.set(event.pointerId, this.pointerPosition(event));
    } else if (!this.canPan()) {
      return;
    }

    viewport.setPointerCapture(event.pointerId);
    if (this.touchPointers.size === 2) {
      this.startPinch();
    } else if (this.touchPointers.size < 2) {
      this.startPan(event.pointerId, this.pointerPosition(event));
    }
    event.preventDefault();
  }

  protected onPointerMove(event: PointerEvent): void {
    const viewport = this.viewportElement();
    if (!viewport) return;

    if (this.touchPointers.has(event.pointerId)) {
      this.touchPointers.set(event.pointerId, this.pointerPosition(event));
      if (this.touchPointers.size >= 2) {
        this.updatePinch();
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

  protected onPointerUp(event: PointerEvent): void {
    const viewport = this.viewportElement();
    if (!viewport) {
      this.clearInteraction();
      return;
    }
    if (viewport.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }

    if (!this.touchPointers.delete(event.pointerId)) {
      this.clearPointerPan();
      return;
    }

    this.pinchGesture = null;
    if (this.touchPointers.size >= 2) {
      this.startPinch();
      return;
    }

    const remainingPointer = this.touchPointers.entries().next().value;
    if (remainingPointer) {
      this.startPan(remainingPointer[0], remainingPointer[1]);
    } else {
      this.clearPointerPan();
    }
  }

  private startPan(pointerId: number, position: IPdfPointerPosition): void {
    if (!this.canPan()) {
      this.clearPointerPan();
      return;
    }

    const viewport = this.viewportElement();
    if (!viewport) return;
    this.activePointerId = pointerId;
    this.pointerStartX = position.x;
    this.pointerStartY = position.y;
    this.pointerStartScrollLeft = viewport.scrollLeft;
    this.pointerStartScrollTop = viewport.scrollTop;
    this.isPanning.set(true);
  }

  private startPinch(): void {
    const pointers = this.pinchPointers();
    if (!pointers) return;

    const viewport = this.viewportElement();
    const canvas = this.canvasElement();
    if (!viewport || !canvas) return;
    const center = this.pointerCenter(...pointers);
    const bounds = viewport.getBoundingClientRect();

    this.clearPointerPan();
    this.pinchGesture = {
      anchor: this.createAnchor(
        viewport,
        canvas,
        center.x - bounds.left,
        center.y - bounds.top,
      ),
      distance: this.pointerDistance(...pointers),
      zoom: this.zoom(),
    };
  }

  private updatePinch(): void {
    const pointers = this.pinchPointers();
    const gesture = this.pinchGesture;
    if (!pointers || !gesture || gesture.distance === 0) return;

    const viewport = this.viewportElement();
    if (!viewport) return;
    const center = this.pointerCenter(...pointers);
    const bounds = viewport.getBoundingClientRect();
    const zoom = Math.min(
      PDF_VIEWER_ZOOM_MAX,
      Math.max(
        PDF_VIEWER_ZOOM_MIN,
        +(
          (gesture.zoom * this.pointerDistance(...pointers)) /
          gesture.distance
        ).toFixed(2),
      ),
    );

    this.pendingAnchor = {
      ...gesture.anchor,
      viewportLeft: center.x - bounds.left,
      viewportTop: center.y - bounds.top,
    };
    this.zoomChange.emit(zoom);
  }

  private createAnchor(
    viewport: HTMLDivElement,
    canvas: HTMLCanvasElement,
    viewportLeft: number,
    viewportTop: number,
  ): IPdfViewportAnchor {
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

  private pinchPointers(): readonly [
    IPdfPointerPosition,
    IPdfPointerPosition,
  ] | null {
    const [first, second] = this.touchPointers.values();
    return first && second ? [first, second] : null;
  }

  private pointerPosition(event: PointerEvent): IPdfPointerPosition {
    return { x: event.clientX, y: event.clientY };
  }

  private pointerCenter(
    first: IPdfPointerPosition,
    second: IPdfPointerPosition,
  ): IPdfPointerPosition {
    return {
      x: (first.x + second.x) / 2,
      y: (first.y + second.y) / 2,
    };
  }

  private pointerDistance(
    first: IPdfPointerPosition,
    second: IPdfPointerPosition,
  ): number {
    return Math.hypot(second.x - first.x, second.y - first.y);
  }

  private clearPointerPan(): void {
    this.activePointerId = null;
    this.isPanning.set(false);
  }
}
