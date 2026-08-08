import { Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { IftaLabelModule } from 'primeng/iftalabel';
import { TextareaModule } from 'primeng/textarea';

import type { CommercialCtaSectionEditorForm } from '../../../../core/types/commercial-page-editor-form';
import { createAdminCommercialPagesI18n } from '../admin-commercial-pages.i18n';
import { CommercialActionEditor } from './commercial-action-editor';
import { CommercialSectionBaseEditor } from './commercial-section-base-editor';

@Component({
  selector: 'app-commercial-cta-section-editor',
  imports: [
    ReactiveFormsModule,
    IftaLabelModule,
    TextareaModule,
    CommercialActionEditor,
    CommercialSectionBaseEditor,
  ],
  templateUrl: './commercial-cta-section-editor.html',
})
export class CommercialCtaSectionEditor {
  readonly form = input.required<CommercialCtaSectionEditorForm>();
  readonly controlId = input.required<string>();

  protected readonly i18n = createAdminCommercialPagesI18n();
}
