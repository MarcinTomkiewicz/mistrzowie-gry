import { Component, effect, inject, input, signal } from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  NgControl,
  ReactiveFormsModule,
} from '@angular/forms';

import {
  AutoCompleteCompleteEvent,
  AutoCompleteModule,
  AutoCompleteSelectEvent,
} from 'primeng/autocomplete';

import type { ISelectOption } from '../../../../core/interfaces/i-select-option';
import { stringToSlug } from '../../../../core/utils/normalize-text';

@Component({
  selector: 'app-questionnaire-catalog-autocomplete',
  standalone: true,
  imports: [ReactiveFormsModule, AutoCompleteModule],
  templateUrl: './questionnaire-catalog-autocomplete.html',
})
export class QuestionnaireCatalogAutocomplete implements ControlValueAccessor {
  readonly options = input.required<readonly ISelectOption<string>[]>();
  readonly inputId = input.required<string>();
  readonly placeholder = input('');
  readonly autocomplete = input('off');
  readonly emptyValue = input<string | null>(null);

  private readonly ngControl = inject(NgControl, {
    self: true,
    optional: true,
  });
  private readonly value = signal<string | null>(null);
  private propagateChange: (value: unknown) => void = () => undefined;
  private propagateTouched: () => void = () => undefined;

  protected readonly selectionControl =
    new FormControl<ISelectOption<string> | string | null>(null);
  protected readonly suggestions = signal<ISelectOption<string>[]>([]);

  constructor() {
    if (this.ngControl !== null) {
      this.ngControl.valueAccessor = this;
    }

    effect(() => {
      const value = this.value();
      const selectedOption = this.options().find(
        (option) => option.value === value,
      ) ?? null;

      this.selectionControl.setValue(selectedOption, { emitEvent: false });
    });
  }

  writeValue(value: unknown): void {
    this.value.set(typeof value === 'string' ? value : null);
  }

  registerOnChange(onChange: (value: unknown) => void): void {
    this.propagateChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.propagateTouched = onTouched;
  }

  setDisabledState(disabled: boolean): void {
    if (disabled) {
      this.selectionControl.disable({ emitEvent: false });
      return;
    }

    this.selectionControl.enable({ emitEvent: false });
  }

  protected onComplete(event: AutoCompleteCompleteEvent): void {
    if (event.query) {
      this.selectionControl.setValue(event.query, { emitEvent: false });
    }

    const query = stringToSlug(event.query);
    const suggestions = query
      ? this.options().filter((option) =>
          stringToSlug(option.label).includes(query),
        )
      : [...this.options()];

    this.suggestions.set(suggestions);
  }

  protected onSelect(event: AutoCompleteSelectEvent): void {
    const eventValue: unknown = event.value;
    const selectedOption = this.options().find(
      (option) => option === eventValue,
    );
    if (selectedOption === undefined) return;

    this.value.set(selectedOption.value);
    this.propagateChange(selectedOption.value);
  }

  protected onClear(): void {
    const emptyValue = this.emptyValue();
    this.value.set(emptyValue);
    this.propagateChange(emptyValue);
  }

  protected onBlur(): void {
    this.propagateTouched();
  }

  protected isInvalid(): boolean {
    const control = this.ngControl?.control;
    return !!control && control.invalid && (control.dirty || control.touched);
  }
}
