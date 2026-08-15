import { Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';

import {
  createCommercialComparisonRowEditorForm,
  createCommercialComparisonSectionEditorForm,
} from '../../../../core/factories/commercial-block-item-editor-form.factory';
import type { ISelectOption } from '../../../../core/interfaces/i-select-option';
import type {
  CommercialComparisonRowEditorForm,
  CommercialComparisonSectionEditorForm,
  CommercialProductCollectionBlockEditorForm,
} from '../../../../core/types/commercial-builder-block-editor-form';
import { createCommercialPageI18n } from '../../../../core/translations/commercial-pages.i18n';
import {
  moveFormArrayControl,
  moveFormControlArrayItem,
} from '../../../../core/utils/form-controls';
import { createAdminCommercialPagesI18n } from '../admin-commercial-pages.i18n';
import { ItemEditorActions } from '../../../../common/item-editor-actions/item-editor-actions';

@Component({
  selector: 'app-commercial-product-comparison-editor',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    IftaLabelModule,
    InputTextModule,
    MultiSelectModule,
    ItemEditorActions,
  ],
  templateUrl: './commercial-product-comparison-editor.html',
})
export class CommercialProductComparisonEditor {
  readonly form = input.required<CommercialProductCollectionBlockEditorForm>();
  readonly controlId = input.required<string>();

  protected readonly i18n = createAdminCommercialPagesI18n();
  private readonly commercialI18n = createCommercialPageI18n();

  protected fieldOptions(): ISelectOption<string>[] {
    return this.form().controls.fields.controls.map((field) => ({
      value: field.controls.id.getRawValue(),
      label: field.controls.label.getRawValue() ??
        this.commercialI18n.productFieldLabel(field.controls.key.getRawValue()),
    }));
  }

  protected selectedFieldOptions(
    row: CommercialComparisonRowEditorForm,
  ): ISelectOption<string>[] {
    const options = new Map(
      this.fieldOptions().map((option) => [option.value, option] as const),
    );

    return row.controls.fieldIds.getRawValue().map((fieldId) => {
      const option = options.get(fieldId);
      if (!option) {
        throw new TypeError(`Missing commercial product field: ${fieldId}`);
      }

      return option;
    });
  }

  protected addSection(): void {
    const sections = this.form().controls.presentation.controls.sections;
    sections.push(createCommercialComparisonSectionEditorForm());
    sections.markAsDirty();
  }

  protected removeSection(index: number): void {
    const sections = this.form().controls.presentation.controls.sections;
    sections.removeAt(index);
    sections.markAsDirty();
  }

  protected moveSection(index: number, offset: -1 | 1): void {
    moveFormArrayControl(
      this.form().controls.presentation.controls.sections,
      index,
      index + offset,
    );
  }

  protected addRow(section: CommercialComparisonSectionEditorForm): void {
    section.controls.rows.push(createCommercialComparisonRowEditorForm());
    section.controls.rows.markAsDirty();
  }

  protected removeRow(
    section: CommercialComparisonSectionEditorForm,
    index: number,
  ): void {
    section.controls.rows.removeAt(index);
    section.controls.rows.markAsDirty();
  }

  protected moveRow(
    section: CommercialComparisonSectionEditorForm,
    index: number,
    offset: -1 | 1,
  ): void {
    moveFormArrayControl(section.controls.rows, index, index + offset);
  }

  protected removeRowField(
    row: CommercialComparisonRowEditorForm,
    index: number,
  ): void {
    const control = row.controls.fieldIds;
    const fieldIds = [...control.getRawValue()];
    fieldIds.splice(index, 1);
    control.setValue(fieldIds);
    control.markAsDirty();
  }

  protected moveRowField(
    row: CommercialComparisonRowEditorForm,
    index: number,
    offset: -1 | 1,
  ): void {
    moveFormControlArrayItem(row.controls.fieldIds, index, index + offset);
  }
}
