import { Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';

import { createCommercialFaqItemEditorForm } from '../../../../core/factories/commercial-item-editor-form.factory';
import type { CommercialFaqSectionEditorForm } from '../../../../core/types/commercial-page-editor-form';
import { moveFormArrayControl } from '../../../../core/utils/form-controls';
import { createAdminCommercialPagesI18n } from '../admin-commercial-pages.i18n';
import { CommercialItemEditorActions } from './commercial-item-editor-actions';
import { CommercialSectionBaseEditor } from './commercial-section-base-editor';

@Component({
  selector: 'app-commercial-faq-section-editor',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    IftaLabelModule,
    InputTextModule,
    TextareaModule,
    CommercialItemEditorActions,
    CommercialSectionBaseEditor,
  ],
  templateUrl: './commercial-faq-section-editor.html',
})
export class CommercialFaqSectionEditor {
  readonly form = input.required<CommercialFaqSectionEditorForm>();
  readonly controlId = input.required<string>();

  protected readonly i18n = createAdminCommercialPagesI18n();

  protected addItem(): void {
    const items = this.form().controls.items;

    items.push(createCommercialFaqItemEditorForm());
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
