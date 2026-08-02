import { Component, computed, input, signal } from '@angular/core';

import { ButtonModule } from 'primeng/button';

import type { ICoworkerDocumentDefinition } from '../../../../../core/interfaces/i-coworker-document';
import { formatFileSizeMiB } from '../../../../../core/utils/file-size';
import { createDocumentsI18n } from '../documents.i18n';

@Component({
  selector: 'app-document-definition-card',
  standalone: true,
  imports: [ButtonModule],
  templateUrl: './document-definition-card.html',
})
export class DocumentDefinitionCard {
  readonly definition = input.required<ICoworkerDocumentDefinition>();

  protected readonly i18n = createDocumentsI18n();
  protected readonly rulesExpanded = signal(false);
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
  protected readonly maxFileSize = computed(() =>
    formatFileSizeMiB(this.definition().maxSizeBytes)
  );
  protected readonly rulesId = computed(() =>
    `document-definition-rules-${this.definition().id}`
  );

  protected toggleRules(): void {
    this.rulesExpanded.update((expanded) => !expanded);
  }
}
