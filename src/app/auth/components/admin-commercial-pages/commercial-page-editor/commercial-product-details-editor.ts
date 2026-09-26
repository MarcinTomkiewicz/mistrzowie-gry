import { Component, computed, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { IftaLabelModule } from 'primeng/iftalabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';

import {
  COMMERCIAL_EDITOR_DURATION_MODES,
  COMMERCIAL_EDITOR_PARTICIPANTS_MODES,
  COMMERCIAL_SESSION_MODES,
} from '../../../../core/configs/commercial-pages.config';
import type { CommercialPagePublicationIssueIndex } from '../../../../core/domain/commercial-pages/commercial-page-publication-issues';
import { syncCommercialProductEditorControls } from '../../../../core/factories/commercial-product-editor-form.factory';
import { createCommercialPageI18n } from '../../../../core/translations/commercial-pages.i18n';
import type { CommercialProductEditorForm } from '../../../../core/types/commercial-page-editor-form';
import { createAdminCommercialPagesI18n } from '../admin-commercial-pages.i18n';
import { CommercialPublicationIssueMessages } from './commercial-publication-issue-messages';

@Component({
  selector: 'app-commercial-product-details-editor',
  imports: [
    ReactiveFormsModule,
    IftaLabelModule,
    InputNumberModule,
    SelectModule,
    CommercialPublicationIssueMessages,
  ],
  templateUrl: './commercial-product-details-editor.html',
})
export class CommercialProductDetailsEditor {
  readonly form = input.required<CommercialProductEditorForm>();
  readonly controlId = input.required<string>();
  readonly diagnostics = input.required<CommercialPagePublicationIssueIndex>();

  protected readonly i18n = createAdminCommercialPagesI18n();
  protected readonly commercialI18n = createCommercialPageI18n();
  protected readonly durationModeOptions = computed(() => {
    const labels = this.i18n.durationMode();
    return COMMERCIAL_EDITOR_DURATION_MODES.map((value) => ({
      value,
      label: value === 'not_applicable'
        ? this.i18n.commonValues().notApplicable
        : labels[value],
    }));
  });
  protected readonly participantsModeOptions = computed(() => {
    const labels = this.i18n.participantsMode();
    return COMMERCIAL_EDITOR_PARTICIPANTS_MODES.map((value) => ({
      value,
      label: value === 'not_applicable'
        ? this.i18n.commonValues().notApplicable
        : labels[value],
    }));
  });
  protected readonly sessionModeOptions = computed(() => {
    const labels = this.i18n.sessionMode();
    return COMMERCIAL_SESSION_MODES.map((value) => ({
      value,
      label: value === 'not_applicable'
        ? this.i18n.commonValues().notApplicable
        : labels[value],
    }));
  });

  protected syncModes(): void {
    syncCommercialProductEditorControls(this.form());
  }
}
