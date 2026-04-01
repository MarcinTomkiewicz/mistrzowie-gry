import { Component, computed, input, output, signal } from '@angular/core';

import { InputTextModule } from 'primeng/inputtext';
import { IChipPickerOption } from '../../../core/interfaces/i-chip-picker';

@Component({
  selector: 'app-chip-picker',
  standalone: true,
  imports: [InputTextModule],
  templateUrl: './chip-picker.html',
  styleUrl: './chip-picker.scss',
})
export class ChipPicker {
  readonly options = input.required<IChipPickerOption[]>();
  readonly selected = input<string[]>([]);
  readonly selectedChange = output<string[]>();

  readonly maxSelected = input<number>(Infinity);
  readonly disabled = input<boolean>(false);
  readonly searchable = input<boolean>(false);
  readonly searchPlaceholder = input<string>('');
  readonly emptyLabel = input<string>('');

  private readonly term = signal('');

  readonly filteredOptions = computed(() => {
    const normalizedTerm = this.term().trim().toLowerCase();
    const options = this.options();

    if (!this.searchable() || !normalizedTerm) {
      return options;
    }

    return options.filter((option) => {
      const haystack = [option.label, option.searchText ?? '']
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedTerm);
    });
  });

  onSearch(event: Event): void {
    if (this.disabled()) {
      return;
    }

    this.term.set((event.target as HTMLInputElement).value ?? '');
  }

  isSelected(optionId: string): boolean {
    return this.selected().includes(optionId);
  }

  isOptionDisabled(optionId: string): boolean {
    if (this.disabled()) {
      return true;
    }

    const selected = this.selected();

    return selected.length >= this.maxSelected() && !selected.includes(optionId);
  }

  toggle(optionId: string): void {
    if (this.isOptionDisabled(optionId)) {
      return;
    }

    const selected = this.selected();
    const index = selected.indexOf(optionId);

    if (index >= 0) {
      this.selectedChange.emit(selected.filter((id) => id !== optionId));
      return;
    }

    this.selectedChange.emit([...selected, optionId]);
  }

  resolveClassNames(option: IChipPickerOption): string[] {
    const isSelected = this.isSelected(option.id);

    return [
      'tag-badge',
      'chip-picker__chip',
      isSelected
        ? (option.selectedClassName ?? 'tag-badge--arcane')
        : (option.unselectedClassName ?? 'tag-badge--muted'),
      this.isOptionDisabled(option.id) ? 'chip-picker__chip--disabled' : '',
      isSelected ? 'chip-picker__chip--selected' : '',
    ].filter(Boolean);
  }

  resolveIconClassNames(option: IChipPickerOption): string[] {
    return ['chip-picker__icon', option.iconClassName ?? ''].filter(Boolean);
  }
}
