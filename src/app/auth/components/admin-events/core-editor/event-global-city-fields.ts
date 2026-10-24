import { NgTemplateOutlet } from '@angular/common';
import { Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';

import type { EventGlobalCityControls } from '../../../../core/factories/event-global-draft-form.factory';
import type { ISelectOption } from '../../../../core/interfaces/i-select-option';
import { createEventCoreEditorI18n } from './core-editor.i18n';

@Component({
  selector: 'app-event-global-city-fields',
  imports: [NgTemplateOutlet, ReactiveFormsModule, ButtonModule, FloatLabelModule, InputTextModule, SelectModule, TooltipModule],
  templateUrl: './event-global-city-fields.html',
  host: { class: 'd-block w-100 min-w-0' },
})
export class EventGlobalCityFields {
  readonly fields = input.required<EventGlobalCityControls>();
  readonly idPrefix = input.required<string>();
  readonly timezones = input.required<ISelectOption[]>();
  protected readonly i18n = createEventCoreEditorI18n();
}
