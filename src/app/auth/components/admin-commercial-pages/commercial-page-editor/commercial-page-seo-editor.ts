import { Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';

import type { CommercialPagePublicationIssueIndex } from '../../../../core/domain/commercial-pages/commercial-page-publication-issues';
import type { CommercialPageSeoEditorForm } from '../../../../core/types/commercial-page-editor-form';
import type { AdminCommercialPagesSeoTranslations } from '../../../../core/types/i18n/admin-commercial-pages';
import { createCommonLabelsI18n } from '../../../../core/translations/common.i18n';
import { CommercialPublicationIssueMessages } from './commercial-publication-issue-messages';

@Component({
  selector: 'app-commercial-page-seo-editor',
  imports: [
    ReactiveFormsModule,
    IftaLabelModule,
    InputTextModule,
    TextareaModule,
    CommercialPublicationIssueMessages,
  ],
  templateUrl: './commercial-page-seo-editor.html',
})
export class CommercialPageSeoEditor {
  protected readonly commonLabels = createCommonLabelsI18n();
  readonly form = input.required<CommercialPageSeoEditorForm>();
  readonly diagnostics = input.required<CommercialPagePublicationIssueIndex>();
  readonly copy = input.required<AdminCommercialPagesSeoTranslations>();
  readonly requiredMessage = input.required<string>();
}
