import {
  Component,
  computed,
  input,
  viewChild,
} from '@angular/core';

import { Popover, PopoverModule } from 'primeng/popover';
import { TooltipModule } from 'primeng/tooltip';

import { ISystem } from '../../../core/interfaces/i-system';
import { normalizeText } from '../../../core/utils/normalize-text';

@Component({
  selector: 'app-system-chip',
  standalone: true,
  imports: [TooltipModule, PopoverModule],
  templateUrl: './system-chip.html',
  styleUrl: './system-chip.scss',
})
export class SystemChip {
  readonly popover = viewChild<Popover>('popover');

  readonly system = input.required<ISystem>();
  readonly badgeClass = input<string>('');
  readonly maxWidthClass = input<string>('max-w-none max-w-150-xs');
  readonly wrapClass = input<string>('text-wrap-auto-xs');
  readonly displayType = input<'chip' | 'text'>('chip');

  readonly label = computed(() => normalizeText(this.system().name) || '');

  readonly description = computed(() => {
    const value = normalizeText(this.system().description);
    return value || undefined;
  });

  readonly hasDescription = computed(() => !!this.description());

  readonly hostClass = computed(() => {
    const classes: string[] = [];

    if (this.displayType() === 'chip') {
      classes.push('tag-badge', 'text-center');

      const badgeClass = normalizeText(this.badgeClass());
      const maxWidthClass = normalizeText(this.maxWidthClass());

      if (badgeClass) {
        classes.push(badgeClass);
      }

      if (maxWidthClass) {
        classes.push(maxWidthClass);
      }
    }

    const wrapClass = normalizeText(this.wrapClass());

    if (wrapClass) {
      classes.push(wrapClass);
    }

    return classes.join(' ');
  });

  readonly mobileHostClass = computed(() => {
    if (this.displayType() === 'chip') {
      return `flex-row-center-center gap-xs w-100 ${this.hostClass()}`.trim();
    }

    return this.hostClass();
  });

  onMobileInfoClick(event: Event): void {
    if (!this.hasDescription()) {
      return;
    }

    this.popover()?.toggle(event);
  }
}