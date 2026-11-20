import { Component, input, output } from '@angular/core';
import { FormControl, FormRecord, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';

import { STATUS_BADGE_CLASS } from '../../../../../core/configs/badge-class.config';
import type { ICoworkerSharedDocument } from '../../../../../core/interfaces/i-coworker-onboarding';
import { createCoworkerOnboardingI18n } from '../../../../../core/translations/coworker-onboarding.i18n';
import { formatTimestampLabel } from '../../../../../core/utils/date';
import type { DocumentFileRequest } from '../onboarding-document-view';

@Component({
  selector: 'app-coworker-shared-documents',
  imports: [ReactiveFormsModule, ButtonModule, CheckboxModule],
  templateUrl: './coworker-shared-documents.html',
  host: { class: 'flex-col-start-stretch gap-md' },
})
export class CoworkerSharedDocuments {
  readonly documents = input.required<readonly ICoworkerSharedDocument[]>();
  readonly onboardingCompleted = input.required<boolean>();
  readonly acknowledgementControls = input.required<FormRecord<FormControl<boolean>>>();
  readonly busy = input.required<boolean>();
  readonly fileRequested = output<DocumentFileRequest>();

  protected readonly i18n = createCoworkerOnboardingI18n();
  protected readonly STATUS_BADGE_CLASS = STATUS_BADGE_CLASS;
  protected readonly formatTimestampLabel = formatTimestampLabel;
}
