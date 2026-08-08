import { Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { IftaLabelModule } from 'primeng/iftalabel';
import { TextareaModule } from 'primeng/textarea';

import type { CommercialRichTextSectionEditorForm } from '../../../../core/types/commercial-page-editor-form';
import { createAdminCommercialPagesI18n } from '../admin-commercial-pages.i18n';
import { CommercialSectionBaseEditor } from './commercial-section-base-editor';

@Component({
  selector: 'app-commercial-rich-text-section-editor',
  imports: [
    ReactiveFormsModule,
    IftaLabelModule,
    TextareaModule,
    CommercialSectionBaseEditor,
  ],
  templateUrl: './commercial-rich-text-section-editor.html',
})
export class CommercialRichTextSectionEditor {
  readonly form = input.required<CommercialRichTextSectionEditorForm>();
  readonly controlId = input.required<string>();

  protected readonly i18n = createAdminCommercialPagesI18n();
}
