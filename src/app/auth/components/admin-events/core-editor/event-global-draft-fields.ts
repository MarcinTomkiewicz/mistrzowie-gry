import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';
import { startWith, switchMap } from 'rxjs';

import { EVENT_CURRENCIES, EVENT_PRICE_BASES } from '../../../../core/configs/events.config';
import type { EventGlobalDraftForm } from '../../../../core/factories/event-global-draft-form.factory';
import { parseIsoDate } from '../../../../core/utils/date';
import { createTimeZoneOptions } from '../../../../core/utils/time-zone';
import { createParticipantSignupKindOptions } from '../participant-signup-kind-options';
import { EventScheduleEditor } from '../edition-editor/event-schedule-editor';
import { createEventCoreEditorI18n } from './core-editor.i18n';
import { EventGlobalDraftDateBlocks } from './event-global-draft-date-blocks';
import { EventGlobalTimeBlocks } from './event-global-time-blocks';
import { EventGlobalCityFields } from './event-global-city-fields';

@Component({
  selector: 'app-event-global-draft-fields',
  imports: [NgTemplateOutlet, ReactiveFormsModule, ButtonModule, FloatLabelModule, InputNumberModule,
    InputTextModule, SelectModule, TextareaModule, ToggleSwitchModule, TooltipModule, EventScheduleEditor,
    EventGlobalTimeBlocks, EventGlobalDraftDateBlocks, EventGlobalCityFields],
  templateUrl: './event-global-draft-fields.html',
  host: { class: 'flex-col-start-stretch gap-md w-100 min-w-0' },
})
export class EventGlobalDraftFields {
  readonly form = input.required<EventGlobalDraftForm>();
  readonly step = input.required<number>();
  readonly scheduleValidationAttempted = input(false);
  protected readonly i18n = createEventCoreEditorI18n();
  protected readonly currencies = [...EVENT_CURRENCIES];
  private readonly initialDate = new Date();
  private readonly schedule = toSignal(toObservable(this.form).pipe(
    switchMap((form) => form.controls.schedule.valueChanges.pipe(startWith(form.controls.schedule.getRawValue()))),
  ));
  protected readonly timezones = computed(() => {
    const schedule = this.schedule() ?? this.form().controls.schedule.getRawValue();
    const date = parseIsoDate(schedule.kind === 'single' ? schedule.date
      : schedule.kind === 'exact_dates' ? [...(schedule.dates ?? [])].sort()[0] : schedule.startDate);
    const referenceDate = date
      ? new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12))
      : this.initialDate;
    return createTimeZoneOptions(referenceDate);
  });
  protected readonly priceBases = computed(() => EVENT_PRICE_BASES.map(value => ({ value, label: this.i18n.priceBases()[value] })));
  protected readonly signupKinds = computed(() => createParticipantSignupKindOptions(this.i18n.participantKinds()));
}
