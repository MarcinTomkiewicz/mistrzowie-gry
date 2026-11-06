import { Component, computed, ElementRef, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { startWith, switchMap } from 'rxjs';

import { ContextHelp } from '../../../../common/context-help/context-help';
import { CharacterCounter } from '../../../../common/character-counter/character-counter';
import type { EventGlobalDraftForm } from '../../../../core/factories/event-global-draft-form.factory';
import { parseIsoDate } from '../../../../core/utils/date';
import { createTimeZoneOptions } from '../../../../core/utils/time-zone';
import { EventPriceFields } from '../event-price-fields/event-price-fields';
import { EventSignupFields } from '../event-signup-fields/event-signup-fields';
import { EventScheduleEditor } from '../edition-editor/event-schedule-editor';
import { createEventCoreEditorI18n } from './core-editor.i18n';
import { EventGlobalDraftDateBlocks } from './event-global-draft-date-blocks';
import { EventGlobalTimeBlocks } from './event-global-time-blocks';
import { EventGlobalCityFields } from './event-global-city-fields';

@Component({
  selector: 'app-event-global-draft-fields',
  imports: [ReactiveFormsModule, InputNumberModule,
    InputTextModule, TextareaModule, ToggleSwitchModule, ContextHelp, CharacterCounter, EventScheduleEditor, EventPriceFields, EventSignupFields,
    EventGlobalTimeBlocks, EventGlobalDraftDateBlocks, EventGlobalCityFields],
  templateUrl: './event-global-draft-fields.html',
  host: { class: 'flex-col-start-stretch gap-md w-100 min-w-0' },
})
export class EventGlobalDraftFields {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly form = input.required<EventGlobalDraftForm>();
  readonly step = input.required<number>();
  readonly scheduleValidationAttempted = input(false);
  protected readonly i18n = createEventCoreEditorI18n();
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

  fieldElement(field: string): HTMLElement | null {
    const [name, index, blockField] = field.split('.');
    const host = this.host.nativeElement;
    const sharedFieldIds = new Map([
      ['priceAmount', 'global-event-price-amount'], ['priceCurrency', 'global-event-price-currency'],
      ['priceBasis', 'global-event-price-basis'], ['participantSignupKind', 'global-event-signup-kind'],
      ['signupRequired', 'global-event-signup-required'],
    ]);
    const sharedId = sharedFieldIds.get(field);
    const scope = blockField ? host.querySelector<HTMLElement>(`[data-event-base-blocks] [data-event-block="${index}"]`) : host;
    const control = sharedId ? host.querySelector<HTMLElement>(`#${sharedId}`)
      : field === 'schedule' ? host.querySelector<HTMLElement>(
        '[data-event-schedule] .p-invalid, [data-event-schedule] [aria-invalid="true"], [data-event-schedule] .ng-invalid',
      ) ?? host.querySelector<HTMLElement>('[data-event-schedule] input')
      : field === 'timeBlocks' ? host.querySelector<HTMLElement>('#global-base-add')
      : field === 'dateTimeBlocks' || field === 'mainCityDateTimeBlocks' ? host.querySelector<HTMLElement>('[data-event-dated-drafts] input')
      : Array.from(scope?.querySelectorAll<HTMLElement>('[formControlName], [name]') ?? [])
        .find(element => (element.getAttribute('formControlName') ?? element.getAttribute('name')) === (blockField ?? name));
    return control?.matches('input, textarea, button, [tabindex="0"]') ? control
      : control?.querySelector<HTMLElement>('input, button, [tabindex="0"]') ?? null;
  }
}
