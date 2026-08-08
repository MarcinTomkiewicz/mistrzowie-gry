import { Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { CheckboxModule } from 'primeng/checkbox';
import { IftaLabelModule } from 'primeng/iftalabel';
import { TextareaModule } from 'primeng/textarea';

import type { CommercialHeroSectionEditorForm } from '../../../../core/types/commercial-page-editor-form';
import { setControlEnabled } from '../../../../core/utils/form-controls';
import { createAdminCommercialPagesI18n } from '../admin-commercial-pages.i18n';
import { CommercialActionEditor } from './commercial-action-editor';
import { CommercialSectionBaseEditor } from './commercial-section-base-editor';

@Component({
  selector: 'app-commercial-hero-section-editor',
  imports: [
    ReactiveFormsModule,
    CheckboxModule,
    IftaLabelModule,
    TextareaModule,
    CommercialActionEditor,
    CommercialSectionBaseEditor,
  ],
  templateUrl: './commercial-hero-section-editor.html',
})
export class CommercialHeroSectionEditor {
  readonly form = input.required<CommercialHeroSectionEditorForm>();
  readonly controlId = input.required<string>();

  protected readonly i18n = createAdminCommercialPagesI18n();

  protected syncAction(): void {
    setControlEnabled(
      this.form().controls.action,
      this.form().controls.hasAction.value,
    );
  }
}
