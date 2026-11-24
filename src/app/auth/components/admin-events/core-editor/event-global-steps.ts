import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, input, output, TemplateRef } from '@angular/core';
import { StepperModule } from 'primeng/stepper';

import { createEventCoreEditorI18n } from './core-editor.i18n';

@Component({
  selector: 'app-event-global-steps',
  imports: [NgTemplateOutlet, StepperModule],
  templateUrl: './event-global-steps.html',
  host: { class: 'd-block w-100 min-w-0' },
})
export class EventGlobalSteps {
  readonly activeStep = input.required<number>();
  readonly reachedStep = input(6);
  readonly disabled = input(false);
  readonly errorSteps = input<readonly number[]>([]);
  readonly stepContent = input.required<TemplateRef<unknown>>();
  readonly stepSelected = output<number>();
  private readonly i18n = createEventCoreEditorI18n();
  protected readonly steps = computed(() => {
    const { location, policy, program } = this.i18n.creationSteps();
    const { event, schedule, summary } = this.i18n.commonLabels();
    return [event, location, schedule, policy, program, summary]
      .map((label, index) => ({ value: index + 1, label }));
  });

  protected selectStep(step: number | undefined): void {
    if (step !== undefined && !this.disabled() && step >= 1 && step <= this.reachedStep()) {
      this.stepSelected.emit(step);
    }
  }
}
