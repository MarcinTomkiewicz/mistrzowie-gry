import { Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { IftaLabelModule } from 'primeng/iftalabel';
import { InputNumberModule } from 'primeng/inputnumber';

import type { CommercialCapacityEditorForm } from '../../../../core/types/commercial-page-editor-form';
import { createAdminCommercialPagesI18n } from '../admin-commercial-pages.i18n';

@Component({
  selector: 'app-commercial-capacity-editor',
  imports: [ReactiveFormsModule, IftaLabelModule, InputNumberModule],
  templateUrl: './commercial-capacity-editor.html',
})
export class CommercialCapacityEditor {
  readonly form = input.required<CommercialCapacityEditorForm>();
  readonly controlId = input.required<string>();

  protected readonly i18n = createAdminCommercialPagesI18n();
}
