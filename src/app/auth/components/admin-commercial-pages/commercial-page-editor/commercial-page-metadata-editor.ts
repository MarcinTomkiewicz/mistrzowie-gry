import { Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';

import type { CommercialPagePublicationIssueIndex } from '../../../../core/domain/commercial-pages/commercial-page-publication-issues';
import type { CommercialPageMetadataEditorForm } from '../../../../core/types/commercial-page-editor-form';
import type { AdminCommercialPagesMetadataTranslations } from '../../../../core/types/i18n/admin-commercial-pages';
import { createCommonLabelsI18n } from '../../../../core/translations/common.i18n';
import { CommercialPublicationIssueMessages } from './commercial-publication-issue-messages';

@Component({
  selector: 'app-commercial-page-metadata-editor',
  imports: [
    ReactiveFormsModule,
    IftaLabelModule,
    InputTextModule,
    TextareaModule,
    CommercialPublicationIssueMessages,
  ],
  templateUrl: './commercial-page-metadata-editor.html',
})
export class CommercialPageMetadataEditor {
  protected readonly commonLabels = createCommonLabelsI18n();
  readonly form = input.required<CommercialPageMetadataEditorForm>();
  readonly diagnostics = input.required<CommercialPagePublicationIssueIndex>();
  readonly copy = input.required<AdminCommercialPagesMetadataTranslations>();
  readonly publishedSlug = input.required<string>();
  readonly requiredMessage = input.required<string>();
}
