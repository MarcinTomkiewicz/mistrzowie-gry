import { Component, computed, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';

import type { StaffingFinalSessionOverrideForm } from '../../../../core/types/staffing-final-plan-form';
import { SESSION_DIFFICULTY_LEVEL_OPTIONS } from '../../../../core/types/sessions';
import { createStaffingFinalPlanEditorI18n } from './staffing-final-plan-editor.i18n';

@Component({
  selector: 'app-staffing-final-session-override-editor',
  imports: [ReactiveFormsModule, FloatLabelModule, InputNumberModule, InputTextModule, SelectModule, TextareaModule],
  templateUrl: './staffing-final-session-override-editor.html',
})
export class StaffingFinalSessionOverrideEditor {
  readonly form = input.required<StaffingFinalSessionOverrideForm>();
  readonly controlId = input.required<string>();

  protected readonly i18n = createStaffingFinalPlanEditorI18n();
  protected readonly difficultyOptions = computed(() => SESSION_DIFFICULTY_LEVEL_OPTIONS.map(option => ({
    value: option.value, label: this.i18n.sessionDetails.difficulty()[option.i18nKey],
  })));
  protected readonly booleanOptions = computed(() => [
    { value: null, label: this.i18n.finalPlan().override.inherit },
    { value: true, label: this.i18n.commonValues().yes },
    { value: false, label: this.i18n.commonValues().no },
  ]);
}
