import {
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

import { createEventExdateControl } from '../../../../core/factories/event-edition-form.factory';
import { ISelectOption } from '../../../../core/interfaces/i-select-option';
import { EventScheduleFormGroup } from '../../../../core/types/event-admin-form';
import {
  EventMonthlyNth,
  EventRecurrenceKind,
  EventScheduleKind,
} from '../../../../core/types/event';
import { getWeekdayLabels } from '../../../../core/utils/date';
import { createEventScheduleEditorI18n } from './edition-editor.i18n';

@Component({
  selector: 'app-event-schedule-editor',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    CheckboxModule,
    IftaLabelModule,
    InputNumberModule,
    InputTextModule,
    SelectModule,
  ],
  templateUrl: './event-schedule-editor.html',
})
export class EventScheduleEditor implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  readonly form = input.required<EventScheduleFormGroup>();

  protected readonly i18n = createEventScheduleEditorI18n();
  protected readonly scheduleKindOptions = computed<
    ISelectOption<EventScheduleKind>[]
  >(() => [
    {
      value: 'single',
      label: this.i18n.options().single,
    },
    {
      value: 'recurring',
      label: this.i18n.options().recurring,
    },
  ]);
  protected readonly recurrenceKindOptions = computed<
    ISelectOption<EventRecurrenceKind>[]
  >(() => [
    {
      value: 'WEEKLY',
      label: this.i18n.options().weekly,
    },
    {
      value: 'MONTHLY_NTH_WEEKDAY',
      label: this.i18n.options().monthlyNthWeekday,
    },
    {
      value: 'MONTHLY_DAY_OF_MONTH',
      label: this.i18n.options().monthlyDayOfMonth,
    },
  ]);
  protected readonly monthlyNthOptions = computed<
    ISelectOption<EventMonthlyNth>[]
  >(() => [
    { value: 1, label: this.i18n.options().first },
    { value: 2, label: this.i18n.options().second },
    { value: 3, label: this.i18n.options().third },
    { value: 4, label: this.i18n.options().fourth },
    { value: -1, label: this.i18n.options().last },
  ]);
  protected readonly weekdayOptions = getWeekdayLabels('pl-PL', 1).map(
    (label, index) => ({
      value: [1, 2, 3, 4, 5, 6, 0][index],
      label,
    }),
  );

  ngOnInit(): void {
    const form = this.form();

    form.controls.kind.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((kind) => this.syncScheduleKind(kind));
    form.controls.recurrenceKind.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((kind) => this.syncRecurrenceKind(kind));

    this.syncScheduleKind(form.controls.kind.value);
  }

  protected addExdate(): void {
    const exdates = this.form().controls.exdates;

    exdates.push(createEventExdateControl());
    exdates.markAsDirty();
  }

  protected removeExdate(index: number): void {
    const exdates = this.form().controls.exdates;

    exdates.removeAt(index);
    exdates.markAsDirty();
  }

  private syncScheduleKind(kind: EventScheduleKind): void {
    const form = this.form();

    if (kind === 'single') {
      form.patchValue(
        {
          recurrenceKind: 'WEEKLY',
          interval: 1,
          byweekday: [],
          monthlyNth: null,
          monthlyWeekday: null,
          dayOfMonth: null,
          startDate: '',
          endDate: '',
        },
        { emitEvent: false },
      );
      form.controls.exdates.clear({ emitEvent: false });
    } else {
      form.controls.date.setValue('', { emitEvent: false });
      this.syncRecurrenceKind(form.controls.recurrenceKind.value);
    }

    form.updateValueAndValidity({ emitEvent: false });
  }

  private syncRecurrenceKind(kind: EventRecurrenceKind): void {
    const form = this.form();

    if (form.controls.kind.value !== 'recurring') {
      return;
    }

    switch (kind) {
      case 'WEEKLY':
        form.patchValue(
          {
            monthlyNth: null,
            monthlyWeekday: null,
            dayOfMonth: null,
          },
          { emitEvent: false },
        );
        break;
      case 'MONTHLY_NTH_WEEKDAY':
        form.patchValue(
          {
            byweekday: [],
            monthlyNth: form.controls.monthlyNth.value ?? 1,
            monthlyWeekday: form.controls.monthlyWeekday.value ?? 1,
            dayOfMonth: null,
          },
          { emitEvent: false },
        );
        break;
      case 'MONTHLY_DAY_OF_MONTH':
        form.patchValue(
          {
            byweekday: [],
            monthlyNth: null,
            monthlyWeekday: null,
            dayOfMonth: form.controls.dayOfMonth.value ?? 1,
          },
          { emitEvent: false },
        );
        break;
    }

    form.updateValueAndValidity({ emitEvent: false });
  }
}
