import { Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';

import { createCommercialProcessItemEditorForm } from '../../../../core/factories/commercial-item-editor-form.factory';
import type { CommercialProcessSectionEditorForm } from '../../../../core/types/commercial-page-editor-form';
import { moveFormArrayControl } from '../../../../core/utils/form-controls';
import { createAdminCommercialPagesI18n } from '../admin-commercial-pages.i18n';
import { CommercialItemEditorActions } from './commercial-item-editor-actions';
import { CommercialSectionBaseEditor } from './commercial-section-base-editor';

@Component({
  selector: 'app-commercial-process-section-editor',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    IftaLabelModule,
    InputTextModule,
    TextareaModule,
    CommercialItemEditorActions,
    CommercialSectionBaseEditor,
  ],
  templateUrl: './commercial-process-section-editor.html',
})
export class CommercialProcessSectionEditor {
  readonly form = input.required<CommercialProcessSectionEditorForm>();
  readonly controlId = input.required<string>();

  protected readonly i18n = createAdminCommercialPagesI18n();

  protected addItem(): void {
    const items = this.form().controls.items;

    items.push(createCommercialProcessItemEditorForm());
    items.markAsDirty();
  }

  protected removeItem(index: number): void {
    const items = this.form().controls.items;

    items.removeAt(index);
    items.markAsDirty();
  }

  protected moveItem(index: number, offset: -1 | 1): void {
    moveFormArrayControl(this.form().controls.items, index, index + offset);
  }
}
