import { Component, computed, input, output, signal } from '@angular/core';

import { ButtonModule } from 'primeng/button';

import type {
  ICoworkerAvailableDocumentDefinition,
  ICoworkerPortalDocument,
} from '../../../../../core/interfaces/i-coworker-document';
import type { EdgeFunctionError } from '../../../../../core/types/edge-function-error';
import { getCoworkerDocumentCapability } from '../../../../../core/utils/coworker-document-capability';
import { DocumentUpload } from '../document-upload/document-upload';
import { createDocumentsI18n } from '../documents.i18n';

@Component({
  selector: 'app-available-document-card',
  standalone: true,
  imports: [ButtonModule, DocumentUpload],
  templateUrl: './available-document-card.html',
})
export class AvailableDocumentCard {
  readonly definition = input.required<ICoworkerAvailableDocumentDefinition>();
  readonly documents = input.required<readonly ICoworkerPortalDocument[]>();
  readonly onboardingCaseId = input.required<string | null>();
  readonly disabled = input.required<boolean>();

  readonly completed = output<void>();
  readonly busyChange = output<boolean>();
  readonly blockingError = output<EdgeFunctionError>();
  readonly reloadRequired = output<void>();

  protected readonly i18n = createDocumentsI18n();
  protected readonly rulesExpanded = signal(false);
  protected readonly capability = computed(() => getCoworkerDocumentCapability(
    this.definition(),
    this.documents(),
    null,
    null,
  ));
  protected readonly formatBadge = computed(() =>
    this.definition().allowedExtensions
      .map((extension) => extension.replace(/^\./, '').toUpperCase())
      .join(', ')
  );
  protected readonly signatureDeclarations = computed(() => {
    const labels = this.i18n.statuses().signatures;
    return this.definition().signaturePolicy.allowedDeclarationTypes
      .map((type) => labels[type])
      .join(', ');
  });
  protected readonly rulesId = computed(() =>
    `available-document-rules-${this.definition().id}`
  );

  protected toggleRules(): void {
    this.rulesExpanded.update((expanded) => !expanded);
  }
}
