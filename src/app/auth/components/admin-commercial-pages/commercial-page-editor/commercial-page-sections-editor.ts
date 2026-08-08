import { Component, computed, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';

import { createNewCommercialSectionEditorForm } from '../../../../core/factories/commercial-section-editor-form.factory';
import type {
  CommercialPageKey,
  CommercialSectionType,
} from '../../../../core/types/commercial-page';
import type { CommercialSectionsEditorForm } from '../../../../core/types/commercial-page-editor-form';
import { moveFormArrayControl } from '../../../../core/utils/form-controls';
import { createAdminCommercialPagesI18n } from '../admin-commercial-pages.i18n';
import { CommercialSectionEditor } from './commercial-section-editor';

@Component({
  selector: 'app-commercial-page-sections-editor',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    SelectModule,
    CommercialSectionEditor,
  ],
  templateUrl: './commercial-page-sections-editor.html',
})
export class CommercialPageSectionsEditor {
  readonly sections = input.required<CommercialSectionsEditorForm>();
  readonly allowedSectionTypes = input.required<CommercialSectionType[]>();
  readonly pageKey = input.required<CommercialPageKey>();
  readonly locale = input.required<string>();

  protected readonly i18n = createAdminCommercialPagesI18n();
  protected readonly selectedType = new FormControl<CommercialSectionType | null>(
    null,
  );
  protected readonly sectionTypeOptions = computed(() => {
    const labels = this.i18n.sectionType();

    return this.allowedSectionTypes()
      .filter(
        (type) =>
          type !== 'logistics_fees' ||
          this.pageKey() === 'standards-logistics',
      )
      .map((value) => ({ value, label: labels[value] }));
  });

  protected addSection(): void {
    const type = this.selectedType.value;
    if (!type) return;

    const sections = this.sections();
    sections.push(
      createNewCommercialSectionEditorForm(
        type,
        this.pageKey(),
        this.locale(),
      ),
    );
    sections.markAsDirty();
    this.selectedType.setValue(null);
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
