import { Component, computed, input, linkedSignal, output } from '@angular/core';
import { FormControl, FormRecord, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { TabsModule } from 'primeng/tabs';

import { FileUpload } from '../../../../../common/file-upload/file-upload';
import { STATUS_BADGE_CLASS } from '../../../../../core/configs/badge-class.config';
import { COWORKER_PDF_UPLOAD_OPTIONS } from '../../../../../core/configs/coworker-onboarding.config';
import { createCoworkerOnboardingI18n } from '../../../../../core/translations/coworker-onboarding.i18n';
import type { DocumentFileRequest, PrivateDocumentRow } from '../onboarding-document-view';

@Component({
  selector: 'app-coworker-private-documents',
  imports: [RouterLink, ReactiveFormsModule, ButtonModule, CheckboxModule, TabsModule, FileUpload],
  templateUrl: './coworker-private-documents.html',
})
export class CoworkerPrivateDocuments {
  readonly rows = input.required<readonly PrivateDocumentRow[]>();
  readonly hasOnboarding = input.required<boolean>();
  readonly questionnaireComplete = input.required<boolean>();
  readonly declarationControls = input.required<FormRecord<FormControl<boolean>>>();
  readonly acknowledgementControls = input.required<FormRecord<FormControl<boolean>>>();
  readonly selectedFiles = input.required<ReadonlyMap<string, File>>();
  readonly activeMutationKey = input.required<string | null>();
  readonly fileRequested = output<DocumentFileRequest>();
  readonly signedFilesSelected = output<{ assignmentId: string; files: readonly File[] }>();
  readonly signatureSubmitted = output<string>();

  protected readonly i18n = createCoworkerOnboardingI18n();
  protected readonly STATUS_BADGE_CLASS = STATUS_BADGE_CLASS;
  protected readonly uploadOptions = computed(() => ({
    ...COWORKER_PDF_UPLOAD_OPTIONS,
    disabled: this.activeMutationKey() !== null,
  }));
  protected readonly categories = computed(() => {
    const categories = new Map<string, {
      key: string;
      label: string;
      status: PrivateDocumentRow['document']['category_status'];
      rows: PrivateDocumentRow[];
    }>();
    for (const row of this.rows()) {
      const { category, category_name, category_status } = row.document;
      const existing = categories.get(category);
      if (existing) {
        existing.rows.push(row);
      } else {
        categories.set(category, {
          key: category,
          label: category_name,
          status: category_status,
          rows: [row],
        });
      }
    }
    return [...categories.values()].sort((a, b) =>
      a.label.localeCompare(b.label, 'pl') || a.key.localeCompare(b.key),
    );
  });
  protected readonly activeCategory = linkedSignal({
    source: this.categories,
    computation: (categories, previous): string | number | undefined =>
      categories.find(({ key }) => key === previous?.value)?.key ?? categories[0]?.key,
  });
}
