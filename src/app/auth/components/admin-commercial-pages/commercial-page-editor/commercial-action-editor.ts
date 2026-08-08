import { Component, computed, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

import { COMMERCIAL_ACTION_APPEARANCES } from '../../../../core/configs/commercial-pages.config';
import type { CommercialActionEditorForm } from '../../../../core/types/commercial-page-editor-form';
import { createAdminCommercialPagesI18n } from '../admin-commercial-pages.i18n';

@Component({
  selector: 'app-commercial-action-editor',
  imports: [ReactiveFormsModule, IftaLabelModule, InputTextModule, SelectModule],
  templateUrl: './commercial-action-editor.html',
})
export class CommercialActionEditor {
  readonly form = input.required<CommercialActionEditorForm>();
  readonly controlId = input.required<string>();

  protected readonly i18n = createAdminCommercialPagesI18n();
  protected readonly appearanceOptions = computed(() => {
    const labels = this.i18n.actionAppearance();

    return COMMERCIAL_ACTION_APPEARANCES.map((value) => ({
      value,
      label: labels[value],
    }));
  });
}
