import { Component, ElementRef, computed, inject, input, output, signal } from '@angular/core';

import type { IPdfPageSurface, IPdfPointerPosition } from '../../../core/interfaces/i-pdf';
import type { ContractArea, ContractPage, ContractPlacement } from '../../../core/types/contract-template-configuration';
import { createAdminContractTemplatesI18n } from './admin-contract-templates.i18n';

type GeometryChange = { index: number | null; area: ContractArea; page: number };
type Gesture = { pointerId: number; index: number | null; mode: 'draw' | 'move' | 'resize'; start: IPdfPointerPosition; original: ContractArea };

@Component({
  selector: 'app-contract-placement-overlay',
  templateUrl: './contract-placement-overlay.html',
  host: {
    class: 'position-absolute inset-0',
    '[style.pointer-events]': 'editable() ? "auto" : "none"',
    '(pointermove)': 'move($event)',
    '(pointerup)': 'finish($event)',
    '(pointercancel)': 'finish($event, true)',
    '(lostpointercapture)': 'finish($event, true)',
  },
})
export class ContractPlacementOverlay {
  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;
  readonly surface = input.required<IPdfPageSurface>();
  readonly page = input.required<ContractPage>();
  readonly placements = input.required<ContractPlacement[]>();
  readonly selected = input<number | null>(null);
  readonly editable = input(false);
  readonly canDraw = input(false);
  readonly geometryChange = output<GeometryChange>();
  readonly selectedChange = output<number>();
  protected readonly i18n = createAdminContractTemplatesI18n();
  protected readonly pending = signal<ContractArea | null>(null);
  private gesture?: Gesture;

  protected readonly onPage = computed(() => this.placements().flatMap((area, index) =>
    area.page === this.surface().page ? [{ area, index }] : []));

  protected position(area: ContractArea) {
    const topLeft = this.surface().toViewportPoint(area.x, area.y + area.height);
    const bottomRight = this.surface().toViewportPoint(area.x + area.width, area.y);
    return { left: topLeft.x * 100, top: topLeft.y * 100,
      width: (bottomRight.x - topLeft.x) * 100, height: (bottomRight.y - topLeft.y) * 100 };
  }

  protected begin(event: PointerEvent, mode: Gesture['mode'], index: number | null = null): void {
    if (!this.editable() || event.button !== 0 || this.gesture) return;
    if (event.pointerType !== 'touch') event.stopPropagation();
    event.preventDefault();
    if (index === null && !this.canDraw()) return;
    const start = this.point(event);
    const original = index === null ? { ...start, width: 0, height: 0 } : this.placements()[index];
    if (index !== null) this.selectedChange.emit(index);
    this.host.setPointerCapture(event.pointerId);
    this.gesture = { pointerId: event.pointerId, index, mode, start, original };
    this.pending.set(original);
  }

  protected move(event: PointerEvent): void {
    if (!this.editable()) return;
    if (event.pointerType !== 'touch') event.stopPropagation();
    const gesture = this.gesture;
    if (gesture?.pointerId !== event.pointerId) return;
    const { mode, start, original } = gesture;
    const point = this.point(event);
    const page = this.page();
    if (mode === 'draw') {
      this.pending.set({ x: Math.min(start.x, point.x), y: Math.min(start.y, point.y),
        width: Math.abs(start.x - point.x), height: Math.abs(start.y - point.y) });
    } else if (mode === 'move') {
      this.pending.set({ ...original,
        x: Math.max(0, Math.min(page.width - original.width, original.x + point.x - start.x)),
        y: Math.max(0, Math.min(page.height - original.height, original.y + point.y - start.y)) });
    } else {
      const top = original.y + original.height;
      const y = Math.min(top - 0.01, point.y);
      this.pending.set({ x: original.x, y, width: Math.max(0.01, point.x - original.x), height: top - y });
    }
  }

  protected finish(event: PointerEvent, cancelled = false): void {
    if (this.editable() && event.pointerType !== 'touch') event.stopPropagation();
    const gesture = this.gesture;
    if (gesture?.pointerId !== event.pointerId) return;
    const area = this.pending();
    this.gesture = undefined;
    this.pending.set(null);
    if (this.host.hasPointerCapture(event.pointerId)) this.host.releasePointerCapture(event.pointerId);
    if (!cancelled && this.editable() && area && area.width >= 0.01 && area.height >= 0.01) {
      this.geometryChange.emit({ index: gesture.index, area, page: this.surface().page });
    }
  }

  private point(event: PointerEvent): IPdfPointerPosition {
    const bounds = this.host.getBoundingClientRect();
    const { x, y } = this.surface().toPdfPoint((event.clientX - bounds.left) / bounds.width,
      (event.clientY - bounds.top) / bounds.height);
    return { x: Math.max(0, Math.min(this.page().width, x)), y: Math.max(0, Math.min(this.page().height, y)) };
  }
}
