import { NgTemplateOutlet } from '@angular/common';
import { Component, ElementRef, computed, input, output, signal, type TemplateRef, viewChild } from '@angular/core';

import type {
  IPdfPinchGesture,
  IPdfPageSurface,
  IPdfPointerPosition,
  IPdfViewportAnchor,
} from '../../core/interfaces/i-pdf';
import {
  PDF_VIEWER_ZOOM_MAX,
  PDF_VIEWER_ZOOM_MIN,
  PDF_VIEWER_ZOOM_STEP,
} from './pdf-viewer.config';

type PointerPan = { id: number; start: IPdfPointerPosition; scrollLeft: number; scrollTop: number };

@Component({
  selector: 'app-pdf-viewer-viewport',
  imports: [NgTemplateOutlet],
  templateUrl: './pdf-viewer-viewport.html',
  styleUrl: './pdf-viewer-viewport.scss',
})
export class PdfViewerViewport {
  readonly zoom = input.required<number>();
  readonly zoomChange = output<number>();
  readonly panEnabled = input(true);
  readonly surface = input<IPdfPageSurface | null>(null);
  readonly overlay = input<TemplateRef<{ $implicit: IPdfPageSurface }> | null>(null);

  private readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly viewportRef = viewChild<ElementRef<HTMLDivElement>>('viewport');
  private readonly touchPointers = new Map<number, IPdfPointerPosition>();
  private pendingAnchor: IPdfViewportAnchor | 'top' | null = null;
  private pinchGesture: IPdfPinchGesture | null = null;
  private pan: PointerPan | null = null;

  protected readonly isPanning = signal(false);
  protected readonly canPan = computed(() => {
    const viewport = this.viewportElement();
    const canvas = this.canvasElement();

    if (!this.panEnabled() || !this.surface() || !viewport || !canvas) return false;

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
    const viewport = this.viewportElement();
    if (!anchor || !viewport) return;
    if (anchor === 'top') {
      viewport.scrollTo({ left: 0, top: 0 });
      this.pendingAnchor = null;
      return;
    }

    const canvas = this.canvasElement();
    if (!canvas) return;
    const canvasBounds = canvas.getBoundingClientRect();
    const viewportBounds = viewport.getBoundingClientRect();
    viewport.scrollTo({
      left: canvasBounds.left - viewportBounds.left + viewport.scrollLeft +
        anchor.contentLeft * canvasBounds.width - anchor.viewportLeft,
      top: canvasBounds.top - viewportBounds.top + viewport.scrollTop +
        anchor.contentTop * canvasBounds.height - anchor.viewportTop,
    });
    this.pendingAnchor = null;
  }

  clearInteraction(): void {
    const viewport = this.viewportElement();
    if (viewport) {
      for (const id of this.touchPointers.keys()) this.releasePointer(viewport, id);
      if (this.pan) this.releasePointer(viewport, this.pan.id);
    }
    this.touchPointers.clear();
    this.pinchGesture = null;
    this.clearPointerPan();
  }

  protected onWheel(event: WheelEvent): void {
    const viewport = this.viewportElement();
    const canvas = this.canvasElement();
    if (!viewport || !canvas || !event.deltaY) return;

    event.preventDefault();
    const zoom = clampZoom(this.zoom() - Math.sign(event.deltaY) * PDF_VIEWER_ZOOM_STEP);
    if (zoom === this.zoom() || !canvas.offsetWidth || !canvas.offsetHeight) return;
    const bounds = viewport.getBoundingClientRect();
    const left = event.clientX - bounds.left;
    const top = event.clientY - bounds.top;
    const anchor = this.pendingAnchor;
    if (!anchor || anchor === 'top' || anchor.viewportLeft !== left || anchor.viewportTop !== top) {
      this.pendingAnchor = this.createAnchor(viewport, canvas, left, top);
    }
    this.zoomChange.emit(zoom);
  }

  protected onPointerDown(event: PointerEvent): void {
    const viewport = this.viewportElement();
    if (!viewport || event.button !== 0) return;

    if (event.pointerType === 'touch') {
      this.touchPointers.set(event.pointerId, pointerPosition(event));
      if (this.touchPointers.size >= 2) {
        // Taking capture cancels any single-finger gesture in a page overlay.
        for (const id of this.touchPointers.keys()) viewport.setPointerCapture(id);
        if (this.touchPointers.size === 2) this.startPinch();
        event.preventDefault();
        return;
      }
    }

    if (!this.canPan()) return;
    viewport.setPointerCapture(event.pointerId);
    this.startPan(event.pointerId, pointerPosition(event));
    event.preventDefault();
  }

  protected onPointerMove(event: PointerEvent): void {
    const viewport = this.viewportElement();
    if (!viewport) return;

    if (this.touchPointers.has(event.pointerId)) {
      this.touchPointers.set(event.pointerId, pointerPosition(event));
      if (this.touchPointers.size >= 2) {
        this.updatePinch();
        event.preventDefault();
        return;
      }
    }

    const pan = this.pan;
    if (!this.panEnabled() || pan?.id !== event.pointerId) return;
    viewport.scrollLeft = pan.scrollLeft - (event.clientX - pan.start.x);
    viewport.scrollTop = pan.scrollTop - (event.clientY - pan.start.y);
    event.preventDefault();
  }

  protected onPointerUp(event: PointerEvent): void {
    const viewport = this.viewportElement();
    if (!viewport) {
      this.clearInteraction();
      return;
    }
    this.releasePointer(viewport, event.pointerId);

    if (!this.touchPointers.delete(event.pointerId)) {
      if (this.pan?.id === event.pointerId) this.clearPointerPan();
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

  private releasePointer(viewport: HTMLDivElement, id: number): void {
    if (viewport.hasPointerCapture(id)) viewport.releasePointerCapture(id);
  }

  private startPan(pointerId: number, position: IPdfPointerPosition): void {
    if (!this.canPan()) {
      this.clearPointerPan();
      return;
    }

    const viewport = this.viewportElement();
    if (!viewport) return;
    this.pan = { id: pointerId, start: position, scrollLeft: viewport.scrollLeft, scrollTop: viewport.scrollTop };
    this.isPanning.set(true);
  }

  private startPinch(): void {
    const measurement = this.pinchMeasurement();
    const viewport = this.viewportElement();
    const canvas = this.canvasElement();
    if (!measurement || !viewport || !canvas) return;
    const { center, distance } = measurement;
    const bounds = viewport.getBoundingClientRect();

    this.clearPointerPan();
    this.pinchGesture = {
      anchor: this.createAnchor(
        viewport,
        canvas,
        center.x - bounds.left,
        center.y - bounds.top,
      ),
      distance,
      zoom: this.zoom(),
    };
  }

  private updatePinch(): void {
    const measurement = this.pinchMeasurement();
    const gesture = this.pinchGesture;
    const viewport = this.viewportElement();
    if (!measurement || !gesture || !gesture.distance || !viewport) return;
    const { center, distance } = measurement;
    const bounds = viewport.getBoundingClientRect();
    const zoom = clampZoom(gesture.zoom * distance / gesture.distance);

    this.pendingAnchor = {
      ...gesture.anchor,
      viewportLeft: center.x - bounds.left,
      viewportTop: center.y - bounds.top,
    };
    if (zoom === this.zoom() && this.surface()) {
      this.applyPendingAnchor();
    } else {
      this.zoomChange.emit(zoom);
    }
  }

  private createAnchor(
    viewport: HTMLDivElement,
    canvas: HTMLCanvasElement,
    viewportLeft: number,
    viewportTop: number,
  ): IPdfViewportAnchor {
    return {
      contentLeft:
        (viewport.getBoundingClientRect().left + viewportLeft - canvas.getBoundingClientRect().left) /
        canvas.offsetWidth,
      contentTop:
        (viewport.getBoundingClientRect().top + viewportTop - canvas.getBoundingClientRect().top) /
        canvas.offsetHeight,
      viewportLeft,
      viewportTop,
    };
  }

  private pinchMeasurement() {
    const [first, second] = this.touchPointers.values();
    if (!first || !second) return null;
    return {
      center: { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 },
      distance: Math.hypot(second.x - first.x, second.y - first.y),
    };
  }

  private clearPointerPan(): void {
    this.pan = null;
    this.isPanning.set(false);
  }
}

function pointerPosition(event: PointerEvent): IPdfPointerPosition {
  return { x: event.clientX, y: event.clientY };
}

function clampZoom(value: number): number {
  return Math.min(PDF_VIEWER_ZOOM_MAX, Math.max(PDF_VIEWER_ZOOM_MIN, +value.toFixed(2)));
}
