import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';
import { startWith, switchMap } from 'rxjs';

import { EVENT_CURRENCIES, EVENT_PRICE_BASES } from '../../../../core/configs/events.config';
import { createEventGlobalTimeBlockForm, type EventGlobalDraftForm } from '../../../../core/factories/event-global-draft-form.factory';
import { isValidDate } from '../../../../core/utils/date';
import { setControlValue } from '../../../../core/utils/form-controls';
import { normalizeTimeInput } from '../../../../core/utils/time-format';
import { createTimeZoneOptions } from '../../../../core/utils/time-zone';
import { createParticipantSignupKindOptions } from '../participant-signup-kind-options';
import { createEventCoreEditorI18n } from './core-editor.i18n';

@Component({
  selector: 'app-event-global-draft-fields',
  imports: [NgTemplateOutlet, ReactiveFormsModule, ButtonModule, DatePickerModule, FloatLabelModule, InputNumberModule,
    InputTextModule, SelectModule, TextareaModule, ToggleSwitchModule, TooltipModule],
  templateUrl: './event-global-draft-fields.html',
  host: { class: 'flex-col-start-stretch gap-md w-100' },
})
export class EventGlobalDraftFields {
  readonly form = input.required<EventGlobalDraftForm>();
  readonly step = input.required<number>();
  protected readonly i18n = createEventCoreEditorI18n();
  protected readonly currencies = [...EVENT_CURRENCIES];
  private readonly initialDate = new Date();
  private readonly date = toSignal(toObservable(this.form).pipe(
    switchMap((form) => form.controls.date.valueChanges.pipe(startWith(form.controls.date.value))),
  ));
  protected readonly timezones = computed(() => {
    const date = this.date();
    const referenceDate = isValidDate(date)
      ? new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12))
      : this.initialDate;
    return createTimeZoneOptions(referenceDate);
  });
  protected readonly priceBases = computed(() => EVENT_PRICE_BASES.map(value => ({ value, label: this.i18n.priceBases()[value] })));
  protected readonly signupKinds = computed(() => createParticipantSignupKindOptions(this.i18n.participantKinds()));

  protected normalizeTime(index: number, field: 'startTime' | 'endTime', event: Event): void {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || this.form().disabled) return;
    const value = normalizeTimeInput(input.value);
    const control = this.form().controls.timeBlocks.at(index).controls[field];
    if (control.value !== value || input.value !== value) setControlValue(control, value);
  }

  protected addBlock(): void {
    if (this.form().disabled) return;
    this.form().controls.timeBlocks.push(createEventGlobalTimeBlockForm());
    this.form().markAsDirty();
  }

  protected removeBlock(index: number): void {
    const form = this.form();
    if (form.disabled || form.controls.timeBlocks.length <= 1) return;
    form.controls.timeBlocks.removeAt(index);
    form.markAsDirty();
  }
}
