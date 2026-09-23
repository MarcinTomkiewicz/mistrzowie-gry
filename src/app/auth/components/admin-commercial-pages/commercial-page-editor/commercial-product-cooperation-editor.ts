import { Component, computed, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { IftaLabelModule } from 'primeng/iftalabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';

import {
  COMMERCIAL_COOPERATION_LENGTH_MODES,
  COMMERCIAL_FREQUENCY_MODES,
} from '../../../../core/configs/commercial-pages.config';
import {
  syncCommercialProductEditorControls,
} from '../../../../core/factories/commercial-product-editor-form.factory';
import { createCommercialPageI18n } from '../../../../core/translations/commercial-pages.i18n';
import type { CommercialProductEditorForm } from '../../../../core/types/commercial-page-editor-form';
import { createAdminCommercialPagesI18n } from '../admin-commercial-pages.i18n';

@Component({
  selector: 'app-commercial-product-cooperation-editor',
  imports: [
    ReactiveFormsModule,
    IftaLabelModule,
    InputNumberModule,
    SelectModule,
  ],
  templateUrl: './commercial-product-cooperation-editor.html',
})
export class CommercialProductCooperationEditor {
  readonly form = input.required<CommercialProductEditorForm>();
  readonly controlId = input.required<string>();

  protected readonly i18n = createAdminCommercialPagesI18n();
  protected readonly commercialI18n = createCommercialPageI18n();
  protected readonly frequencyModeOptions = computed(() => {
    const values = this.i18n.commonValues();

    return COMMERCIAL_FREQUENCY_MODES.map((value) => ({
      value,
      label: value === 'not_applicable'
        ? values.notApplicable
        : value === 'one_time'
          ? values.oneTime
          : values[value],
    }));
  });
  protected readonly cooperationLengthModeOptions = computed(() => {
    const labels = this.i18n.cooperationLengthMode();
    const values = this.i18n.commonValues();

    return COMMERCIAL_COOPERATION_LENGTH_MODES.map((value) => ({
      value,
      label: value === 'not_applicable'
        ? values.notApplicable
        : value === 'one_time'
          ? values.oneTime
          : labels[value],
    }));
  });

  protected syncModes(): void {
    syncCommercialProductEditorControls(this.form());
  }
}
