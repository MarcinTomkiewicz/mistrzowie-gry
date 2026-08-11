import { Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';

import {
  createCommercialTableCellEditorForm,
  createCommercialTableColumnEditorForm,
  createCommercialTableRowEditorForm,
} from '../../../../core/factories/commercial-block-item-editor-form.factory';
import type { CommercialTableBlockEditorForm } from '../../../../core/types/commercial-builder-block-editor-form';
import { moveFormArrayControl } from '../../../../core/utils/form-controls';
import { createAdminCommercialPagesI18n } from '../admin-commercial-pages.i18n';
import { CommercialItemEditorActions } from './commercial-item-editor-actions';
import { CommercialRichContentEditor } from './commercial-rich-content-editor';

@Component({
  selector: 'app-commercial-table-block-editor',
  imports: [ReactiveFormsModule, ButtonModule, CommercialItemEditorActions, CommercialRichContentEditor],
  templateUrl: './commercial-table-block-editor.html',
})
export class CommercialTableBlockEditor {
  readonly form = input.required<CommercialTableBlockEditorForm>();
  readonly controlId = input.required<string>();
  readonly tokens = input<readonly string[]>([]);

  protected readonly i18n = createAdminCommercialPagesI18n();

  protected addColumn(): void {
    const form = this.form();
    const column = createCommercialTableColumnEditorForm();
    const columnId = column.controls.id.getRawValue();
    form.controls.columns.push(column);
    for (const row of form.controls.rows.controls) {
      row.controls.cells.push(createCommercialTableCellEditorForm(columnId));
    }
    form.controls.columns.markAsDirty();
  }
  protected removeColumn(index: number): void {
    const form = this.form();
    form.controls.columns.removeAt(index);
    for (const row of form.controls.rows.controls) row.controls.cells.removeAt(index);
    form.controls.columns.markAsDirty();
  }
  protected moveColumn(index: number, offset: -1 | 1): void {
    const form = this.form();
    moveFormArrayControl(form.controls.columns, index, index + offset);
    for (const row of form.controls.rows.controls) {
      moveFormArrayControl(row.controls.cells, index, index + offset);
    }
  }
  protected addRow(): void {
    const form = this.form();
    const columnIds = form.controls.columns.controls.map((column) => column.controls.id.getRawValue());
    form.controls.rows.push(createCommercialTableRowEditorForm(columnIds));
    form.controls.rows.markAsDirty();
  }
  protected removeRow(index: number): void {
    const rows = this.form().controls.rows;
    rows.removeAt(index);
    rows.markAsDirty();
  }
  protected moveRow(index: number, offset: -1 | 1): void {
    moveFormArrayControl(this.form().controls.rows, index, index + offset);
  }
}
