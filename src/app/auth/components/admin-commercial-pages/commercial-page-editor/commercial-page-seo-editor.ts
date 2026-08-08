import { Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';

import type { CommercialPageSeoEditorForm } from '../../../../core/types/commercial-page-editor-form';
import type { AdminCommercialPagesSeoTranslations } from '../../../../core/types/i18n/admin-commercial-pages';

@Component({
  selector: 'app-commercial-page-seo-editor',
  imports: [
    ReactiveFormsModule,
    IftaLabelModule,
    InputTextModule,
    TextareaModule,
  ],
  templateUrl: './commercial-page-seo-editor.html',
})
export class CommercialPageSeoEditor {
  readonly form = input.required<CommercialPageSeoEditorForm>();
  readonly copy = input.required<AdminCommercialPagesSeoTranslations>();
  readonly requiredMessage = input.required<string>();
}
