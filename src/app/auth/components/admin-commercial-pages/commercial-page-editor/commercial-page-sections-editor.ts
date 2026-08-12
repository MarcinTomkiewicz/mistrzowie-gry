import { Component, input, model } from '@angular/core';
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
  readonly activeSectionId = model<string | null>(null);
  readonly activeBlockId = model<string | null>(null);

  protected readonly i18n = createAdminCommercialPagesI18n();

  protected addSection(): void {
    const sections = this.sections();
    const section = createCommercialSectionEditorForm();
    sections.push(section);
    sections.markAsDirty();
    this.activeSectionId.set(section.controls.id.getRawValue());
    this.activeBlockId.set(null);
  }

  protected removeSection(index: number): void {
    const sections = this.sections();
    const sectionId = sections.at(index).controls.id.getRawValue();
    sections.removeAt(index);
    sections.markAsDirty();

    if (this.activeSectionId() === sectionId) {
      this.activeSectionId.set(null);
      this.activeBlockId.set(null);
    }
  }

  protected moveSection(index: number, offset: -1 | 1): void {
    moveFormArrayControl(this.sections(), index, index + offset);
  }

  protected editSection(index: number): void {
    const sectionId = this.sections().at(index).controls.id.getRawValue();

    if (this.activeSectionId() !== sectionId) {
      this.activeBlockId.set(null);
    }

    this.activeSectionId.set(sectionId);
  }

  protected closeSection(): void {
    this.activeSectionId.set(null);
    this.activeBlockId.set(null);
  }
}
