import { Directive, ElementRef, Renderer2, effect, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap } from '@angular/router';

import { StaffingRealizationReadinessSection } from '../../../core/types/staffing-realization-readiness';
import { scrollElementIntoViewWhenReady } from '../../../core/utils/scroll';

@Directive({ selector: '[appStaffingReadinessTarget]' })
export class StaffingReadinessTarget {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly params = toSignal(inject(ActivatedRoute).queryParamMap, { requireSync: true });
  private highlighted: HTMLElement | null = null;
  private addedClasses: string[] = [];

  readonly section = input.required<StaffingRealizationReadinessSection | null>({ alias: 'appStaffingReadinessTarget' });
  readonly ready = input.required<boolean>({ alias: 'staffingTargetReady' });

  constructor() {
    effect((onCleanup) => {
      const params = this.params();
      let active = true;
      onCleanup(() => {
        active = false;
        this.clearHighlight();
      });
      if (!this.ready() || !this.section() || params.get('readinessSection') !== this.section()) return;
      scrollElementIntoViewWhenReady(() => {
        if (!active) return null;
        const target = this.findTarget(params);
        if (target) this.highlight(target);
        return target;
      }, { behavior: 'smooth', block: 'center' });
    });
  }

  private findTarget(params: ParamMap): HTMLElement | null {
    let scope = this.host.nativeElement.querySelector<HTMLElement>('form') ?? this.host.nativeElement;
    for (const [param, attribute] of [['dayId', 'data-staffing-day-id'], ['slotId', 'data-staffing-slot-id']]) {
      const id = params.get(param);
      if (!id) continue;
      const item = Array.from(scope.querySelectorAll<HTMLElement>(`[${attribute}]`))
        .find((element) => element.getAttribute(attribute) === id);
      if (!item) return null;
      scope = item;
    }
    const field = params.get('field');
    if (!field) return scope;
    const control = Array.from(scope.querySelectorAll<HTMLElement>('[formControlName]'))
      .find((element) => element.getAttribute('formControlName') === field);
    const container = Array.from(scope.querySelectorAll<HTMLElement>('[data-staffing-field]'))
      .find((element) => element.getAttribute('data-staffing-field')?.split(' ').includes(field));
    return control?.closest<HTMLElement>('p-floatlabel') ?? control ?? container ?? scope;
  }

  private highlight(element: HTMLElement): void {
    if (this.highlighted === element) return;
    this.clearHighlight();
    this.highlighted = element;
    this.addedClasses = ['border', 'border-secondary', 'bg-warn-subtle']
      .filter((name) => !element.classList.contains(name));
    for (const name of this.addedClasses) this.renderer.addClass(element, name);
  }

  private clearHighlight(): void {
    if (this.highlighted) {
      for (const name of this.addedClasses) this.renderer.removeClass(this.highlighted, name);
    }
    this.highlighted = null;
    this.addedClasses = [];
  }
}
