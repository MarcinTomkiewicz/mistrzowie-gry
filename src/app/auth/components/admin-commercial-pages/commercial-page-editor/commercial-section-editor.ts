import { Component, computed, input } from '@angular/core';

import {
  isCommercialCtaSectionEditorForm,
  isCommercialEditablePricedSectionEditorForm,
  isCommercialFaqSectionEditorForm,
  isCommercialHeroSectionEditorForm,
  isCommercialProcessSectionEditorForm,
  isCommercialRichTextSectionEditorForm,
  isCommercialSharedReferenceEditorForm,
  isCommercialSharedSectionEditorForm,
} from '../../../../core/factories/commercial-section-editor-form.mapper';
import type { CommercialSectionEditorForm } from '../../../../core/types/commercial-page-editor-form';
import { createAdminCommercialPagesI18n } from '../admin-commercial-pages.i18n';
import { CommercialCtaSectionEditor } from './commercial-cta-section-editor';
import { CommercialFaqSectionEditor } from './commercial-faq-section-editor';
import { CommercialHeroSectionEditor } from './commercial-hero-section-editor';
import { CommercialPricedSectionEditor } from './commercial-priced-section-editor';
import { CommercialProcessSectionEditor } from './commercial-process-section-editor';
import { CommercialRichTextSectionEditor } from './commercial-rich-text-section-editor';

@Component({
  selector: 'app-commercial-section-editor',
  imports: [
    CommercialCtaSectionEditor,
    CommercialFaqSectionEditor,
    CommercialHeroSectionEditor,
    CommercialPricedSectionEditor,
    CommercialProcessSectionEditor,
    CommercialRichTextSectionEditor,
  ],
  templateUrl: './commercial-section-editor.html',
})
export class CommercialSectionEditor {
  readonly form = input.required<CommercialSectionEditorForm>();
  readonly controlId = input.required<string>();

  protected readonly i18n = createAdminCommercialPagesI18n();
  protected readonly sharedReferenceForm = computed(() => {
    const form = this.form();
    return isCommercialSharedReferenceEditorForm(form) ? form : null;
  });
  protected readonly sharedSource = computed(() => {
    const form = this.form();
    return isCommercialSharedSectionEditorForm(form)
      ? form.controls.sharedSource.value
      : null;
  });
  protected readonly heroForm = computed(() => {
    const form = this.form();
    return isCommercialHeroSectionEditorForm(form) ? form : null;
  });
  protected readonly richTextForm = computed(() => {
    const form = this.form();
    return isCommercialRichTextSectionEditorForm(form) ? form : null;
  });
  protected readonly pricedForm = computed(() => {
    const form = this.form();
    return isCommercialEditablePricedSectionEditorForm(form) ? form : null;
  });
  protected readonly processForm = computed(() => {
    const form = this.form();
    return isCommercialProcessSectionEditorForm(form) ? form : null;
  });
  protected readonly faqForm = computed(() => {
    const form = this.form();
    return isCommercialFaqSectionEditorForm(form) ? form : null;
  });
  protected readonly ctaForm = computed(() => {
    const form = this.form();
    return isCommercialCtaSectionEditorForm(form) ? form : null;
  });
  protected readonly priceRequired = computed(() =>
    this.form().controls.type.value !== 'card_grid',
  );
}
