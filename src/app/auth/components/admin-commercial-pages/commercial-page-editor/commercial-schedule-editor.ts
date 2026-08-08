import { Component, computed, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { IftaLabelModule } from 'primeng/iftalabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';

import { COMMERCIAL_DURATION_MODES } from '../../../../core/configs/commercial-pages.config';
import { syncCommercialScheduleDurationControl } from '../../../../core/factories/commercial-price-editor-form.factory';
import type { CommercialScheduleEditorForm } from '../../../../core/types/commercial-page-editor-form';
import { createAdminCommercialPagesI18n } from '../admin-commercial-pages.i18n';

@Component({
  selector: 'app-commercial-schedule-editor',
  imports: [ReactiveFormsModule, IftaLabelModule, InputNumberModule, SelectModule],
  templateUrl: './commercial-schedule-editor.html',
})
export class CommercialScheduleEditor {
  readonly form = input.required<CommercialScheduleEditorForm>();
  readonly controlId = input.required<string>();

  protected readonly i18n = createAdminCommercialPagesI18n();
  protected readonly durationModeOptions = computed(() => {
    const labels = this.i18n.durationMode();

    return COMMERCIAL_DURATION_MODES.map((value) => ({
      value,
      label: labels[value],
    }));
  });

  protected syncDurationMode(): void {
    syncCommercialScheduleDurationControl(this.form());
  }
}
