import { Component, input } from '@angular/core';
import { FormArray } from '@angular/forms';

import { ButtonModule } from 'primeng/button';

import { createCommercialSectionEditorForm } from '../../../../core/factories/commercial-section-editor-form.factory';
import type {
  CommercialProductEditorForm,
  CommercialSectionEditorForm,
} from '../../../../core/types/commercial-page-editor-form';
import { moveFormArrayControl } from '../../../../core/utils/form-controls';
import { createAdminCommercialPagesI18n } from '../admin-commercial-pages.i18n';
import { CommercialSectionEditor } from './commercial-section-editor';

@Component({
  selector: 'app-commercial-page-sections-editor',
  imports: [ButtonModule, CommercialSectionEditor],
  templateUrl: './commercial-page-sections-editor.html',
})
export class CommercialPageSectionsEditor {
  readonly sections = input.required<FormArray<CommercialSectionEditorForm>>();
  readonly products = input.required<FormArray<CommercialProductEditorForm>>();
  readonly tokens = input<readonly string[]>([]);

  protected readonly i18n = createAdminCommercialPagesI18n();

  protected addSection(): void {
    const sections = this.sections();
    sections.push(createCommercialSectionEditorForm());
    sections.markAsDirty();
  }

  protected removeSection(index: number): void {
    const sections = this.sections();
    sections.removeAt(index);
    sections.markAsDirty();
  }

  protected moveSection(index: number, offset: -1 | 1): void {
    moveFormArrayControl(this.sections(), index, index + offset);
  }
}
