import { Component, computed, input } from '@angular/core';
import { FormArray } from '@angular/forms';

import {
  isCommercialButtonsBlockEditorForm,
  isCommercialCardsBlockEditorForm,
  isCommercialFaqBlockEditorForm,
  isCommercialProductCollectionBlockEditorForm,
  isCommercialRichTextBlockEditorForm,
  isCommercialTableBlockEditorForm,
} from '../../../../core/factories/commercial-block-editor-form.mapper';
import type { CommercialPageBlockEditorForm } from '../../../../core/types/commercial-builder-block-editor-form';
import type { CommercialProductEditorForm } from '../../../../core/types/commercial-page-editor-form';
import { createAdminCommercialPagesI18n } from '../admin-commercial-pages.i18n';
import { CommercialButtonsBlockEditor } from './commercial-buttons-block-editor';
import { CommercialCardsBlockEditor } from './commercial-cards-block-editor';
import { CommercialFaqBlockEditor } from './commercial-faq-block-editor';
import { CommercialProductCollectionBlockEditor } from './commercial-product-collection-block-editor';
import { CommercialRichContentEditor } from './commercial-rich-content-editor';
import { CommercialTableBlockEditor } from './commercial-table-block-editor';

@Component({
  selector: 'app-commercial-block-editor',
  imports: [
    CommercialButtonsBlockEditor,
    CommercialCardsBlockEditor,
    CommercialFaqBlockEditor,
    CommercialProductCollectionBlockEditor,
    CommercialRichContentEditor,
    CommercialTableBlockEditor,
  ],
  templateUrl: './commercial-block-editor.html',
})
export class CommercialBlockEditor {
  readonly form = input.required<CommercialPageBlockEditorForm>();
  readonly products = input.required<FormArray<CommercialProductEditorForm>>();
  readonly controlId = input.required<string>();
  readonly tokens = input<readonly string[]>([]);

  protected readonly i18n = createAdminCommercialPagesI18n();
  protected readonly richTextForm = computed(() => {
    const form = this.form();
    return isCommercialRichTextBlockEditorForm(form) ? form : null;
  });
  protected readonly buttonsForm = computed(() => {
    const form = this.form();
    return isCommercialButtonsBlockEditorForm(form) ? form : null;
  });
  protected readonly cardsForm = computed(() => {
    const form = this.form();
    return isCommercialCardsBlockEditorForm(form) ? form : null;
  });
  protected readonly productCollectionForm = computed(() => {
    const form = this.form();
    return isCommercialProductCollectionBlockEditorForm(form) ? form : null;
  });
  protected readonly tableForm = computed(() => {
    const form = this.form();
    return isCommercialTableBlockEditorForm(form) ? form : null;
  });
  protected readonly faqForm = computed(() => {
    const form = this.form();
    return isCommercialFaqBlockEditorForm(form) ? form : null;
  });
}
