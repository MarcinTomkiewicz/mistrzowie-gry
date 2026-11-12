import { Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

import { ContextHelp } from '../../../../common/context-help/context-help';
import { CharacterCounter } from '../../../../common/character-counter/character-counter';
import type { EventGlobalCityControls } from '../../../../core/factories/event-global-draft-form.factory';
import type { ISelectOption } from '../../../../core/interfaces/i-select-option';
import { createEventCoreEditorI18n } from './core-editor.i18n';

@Component({
  selector: 'app-event-global-city-fields',
  imports: [ReactiveFormsModule, InputTextModule, SelectModule, ContextHelp, CharacterCounter],
  templateUrl: './event-global-city-fields.html',
  host: { class: 'd-block w-100 min-w-0' },
})
export class EventGlobalCityFields {
  readonly fields = input.required<EventGlobalCityControls>();
  readonly idPrefix = input.required<string>();
  readonly timezones = input.required<ISelectOption[]>();
  readonly validationAttempted = input(false);
  protected readonly i18n = createEventCoreEditorI18n();

  protected timezoneOptions(): ISelectOption[] {
    const options = this.timezones();
    const current = this.fields().timezone.value;
    return current && !options.some(option => option.value === current)
      ? [{ value: current, label: current }, ...options] : options;
  }
}
