import { Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';

import { createCommercialFaqEntryEditorForm } from '../../../../core/factories/commercial-block-item-editor-form.factory';
import type { CommercialFaqBlockEditorForm } from '../../../../core/types/commercial-builder-block-editor-form';
import { moveFormArrayControl } from '../../../../core/utils/form-controls';
import { createAdminCommercialPagesI18n } from '../admin-commercial-pages.i18n';
import { CommercialItemEditorActions } from './commercial-item-editor-actions';

@Component({
  selector: 'app-commercial-faq-block-editor',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    IftaLabelModule,
    InputTextModule,
    TextareaModule,
    CommercialItemEditorActions,
  ],
  templateUrl: './commercial-faq-block-editor.html',
})
export class CommercialFaqBlockEditor {
  readonly form = input.required<CommercialFaqBlockEditorForm>();
  readonly controlId = input.required<string>();
  protected readonly i18n = createAdminCommercialPagesI18n();

  protected addItem(): void {
    const items = this.form().controls.items;
    items.push(createCommercialFaqEntryEditorForm());
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
