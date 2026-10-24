import { NgTemplateOutlet } from '@angular/common';
import { Component, input } from '@angular/core';
import { AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePicker, DatePickerModule } from 'primeng/datepicker';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';

import { createEventGlobalTimeBlockForm, type EventGlobalTimeBlocksForm } from '../../../../core/factories/event-global-time-block-form.factory';
import { setControlValue } from '../../../../core/utils/form-controls';
import { normalizeTimeInput } from '../../../../core/utils/time-format';
import { createEventCoreEditorI18n } from './core-editor.i18n';

@Component({
  selector: 'app-event-global-time-blocks',
  imports: [NgTemplateOutlet, ReactiveFormsModule, ButtonModule, DatePickerModule, FloatLabelModule,
    InputNumberModule, InputTextModule, TooltipModule],
  templateUrl: './event-global-time-blocks.html',
  host: { class: 'd-block w-100 min-w-0' },
})
export class EventGlobalTimeBlocks {
  readonly blocks = input.required<EventGlobalTimeBlocksForm>();
  readonly idPrefix = input.required<string>();
  readonly validationAttempted = input(false);
  protected readonly i18n = createEventCoreEditorI18n();

  protected canShowScheduleError(control: AbstractControl, picker: DatePicker): boolean {
    return !picker.overlayVisible && (this.validationAttempted() || (control.touched && control.dirty));
  }

  protected showTimeRangeError(block: AbstractControl, start: DatePicker, end: DatePicker): boolean {
    return block.hasError('timeRange') && !end.overlayVisible && this.canShowScheduleError(block, start);
  }

  protected confirmTime(picker: DatePicker): void {
    if (this.blocks().disabled || !picker.overlayVisible) return;
    picker.updateTime();
    picker.hideOverlay();
  }

  protected normalizeTime(index: number, field: 'startTime' | 'endTime', event: Event): void {
    const element = event.target;
    if (!(element instanceof HTMLInputElement) || this.blocks().disabled) return;
    const value = normalizeTimeInput(element.value);
    const control = this.blocks().at(index).controls[field];
    if (control.value !== value || element.value !== value) setControlValue(control, value);
  }

  protected addBlock(): void {
    if (this.blocks().disabled) return;
    this.blocks().push(createEventGlobalTimeBlockForm());
    this.blocks().markAsDirty();
  }

  protected removeBlock(index: number): void {
    if (this.blocks().disabled || this.blocks().length <= 1) return;
    this.blocks().removeAt(index);
    this.blocks().markAsDirty();
  }
}
