import { Component, computed, input } from '@angular/core';
import { FormArray, ReactiveFormsModule } from '@angular/forms';

import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';

import {
  COMMERCIAL_SECTION_SURFACES,
  COMMERCIAL_TEXT_ALIGNS,
} from '../../../../core/configs/commercial-pages.config';
import type {
  CommercialProductEditorForm,
  CommercialSectionEditorForm,
} from '../../../../core/types/commercial-page-editor-form';
import { createAdminCommercialPagesI18n } from '../admin-commercial-pages.i18n';
import { CommercialBlocksEditor } from './commercial-blocks-editor';

@Component({
  selector: 'app-commercial-section-editor',
  imports: [
    ReactiveFormsModule,
    IftaLabelModule,
    InputTextModule,
    SelectModule,
    TextareaModule,
    CommercialBlocksEditor,
  ],
  templateUrl: './commercial-section-editor.html',
})
export class CommercialSectionEditor {
  readonly form = input.required<CommercialSectionEditorForm>();
  readonly products = input.required<FormArray<CommercialProductEditorForm>>();
  readonly controlId = input.required<string>();
  readonly tokens = input<readonly string[]>([]);

  protected readonly i18n = createAdminCommercialPagesI18n();
  protected readonly surfaceOptions = computed(() => {
    const labels = this.i18n.sectionSurface();
    return COMMERCIAL_SECTION_SURFACES.map((value) => ({
      value,
      label: labels[value],
    }));
  });
  protected readonly textAlignOptions = computed(() => {
    const labels = this.i18n.textAlign();
    return COMMERCIAL_TEXT_ALIGNS.map((value) => ({
      value,
      label: labels[value],
    }));
  });
}
