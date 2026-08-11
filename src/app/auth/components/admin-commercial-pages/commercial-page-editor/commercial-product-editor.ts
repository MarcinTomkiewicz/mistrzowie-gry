import { Component, computed, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { IftaLabelModule } from 'primeng/iftalabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

import {
  COMMERCIAL_EDITOR_DURATION_MODES,
  COMMERCIAL_EDITOR_PARTICIPANTS_MODES,
} from '../../../../core/configs/commercial-pages.config';
import { syncCommercialProductEditorControls } from '../../../../core/factories/commercial-product-editor-form.factory';
import type { CommercialProductEditorForm } from '../../../../core/types/commercial-page-editor-form';
import { createAdminCommercialPagesI18n } from '../admin-commercial-pages.i18n';
import { CommercialPriceEditor } from './commercial-price-editor';
import { CommercialRichContentEditor } from './commercial-rich-content-editor';

@Component({
  selector: 'app-commercial-product-editor',
  imports: [
    ReactiveFormsModule,
    IftaLabelModule,
    InputNumberModule,
    InputTextModule,
    SelectModule,
    CommercialPriceEditor,
    CommercialRichContentEditor,
  ],
  templateUrl: './commercial-product-editor.html',
})
export class CommercialProductEditor {
  readonly form = input.required<CommercialProductEditorForm>();
  readonly controlId = input.required<string>();
  readonly tokens = input<readonly string[]>([]);

  protected readonly i18n = createAdminCommercialPagesI18n();
  protected readonly durationModeOptions = computed(() => {
    const labels = this.i18n.durationMode();
    return COMMERCIAL_EDITOR_DURATION_MODES.map((value) => ({
      value,
      label: labels[value],
    }));
  });
  protected readonly participantsModeOptions = computed(() => {
    const labels = this.i18n.participantsMode();
    return COMMERCIAL_EDITOR_PARTICIPANTS_MODES.map((value) => ({
      value,
      label: labels[value],
    }));
  });

  protected syncModes(): void {
    syncCommercialProductEditorControls(this.form());
  }
}
