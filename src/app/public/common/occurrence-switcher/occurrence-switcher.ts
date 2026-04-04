import { CommonModule } from '@angular/common';
import { Component, computed, input, output, viewChild } from '@angular/core';

import { ButtonModule } from 'primeng/button';
import { Popover, PopoverModule } from 'primeng/popover';
import { IOccurrenceSwitcherOption } from '../../../core/interfaces/i-occurrence-switcher';


@Component({
  selector: 'app-occurrence-switcher',
  standalone: true,
  imports: [CommonModule, ButtonModule, PopoverModule],
  templateUrl: './occurrence-switcher.html',
})
export class OccurrenceSwitcher {
  readonly options = input.required<readonly IOccurrenceSwitcherOption[]>();
  readonly selectedIndex = input<number>(0);
  readonly disabled = input<boolean>(false);
  readonly marginBottomClass = input<string>('mb-md');

  readonly selectedIndexChange = output<number>();

  readonly occurrencePopover = viewChild<Popover>('occurrencePopover');

  readonly safeSelectedIndex = computed(() => {
    const options = this.options();
    const selectedIndex = this.selectedIndex();

    if (!options.length) {
      return 0;
    }

    return Math.min(Math.max(selectedIndex, 0), options.length - 1);
  });

  readonly selectedOptionLabel = computed(() => {
    const options = this.options();
    const selectedIndex = this.safeSelectedIndex();

    if (!options.length) {
      return '';
    }

    return options[selectedIndex]?.label ?? '';
  });

  readonly canGoPrev = computed(
    () => !this.disabled() && this.safeSelectedIndex() > 0,
  );

  readonly canGoNext = computed(() => {
    const options = this.options();

    return (
      !this.disabled() &&
      this.safeSelectedIndex() < options.length - 1
    );
  });

  togglePopover(event: Event): void {
    if (this.disabled()) {
      return;
    }

    this.occurrencePopover()?.toggle(event);
  }

  goToPrevious(): void {
    if (!this.canGoPrev()) {
      return;
    }

    this.selectedIndexChange.emit(this.safeSelectedIndex() - 1);
  }

  goToNext(): void {
    if (!this.canGoNext()) {
      return;
    }

    this.selectedIndexChange.emit(this.safeSelectedIndex() + 1);
  }

  selectOccurrence(index: number): void {
    if (this.disabled()) {
      return;
    }

    this.selectedIndexChange.emit(index);
    this.occurrencePopover()?.hide();
  }

  isSelected(index: number): boolean {
    return index === this.safeSelectedIndex();
  }

  trackByIndex = (index: number) => index;
}
