import { Component, computed, input, signal } from '@angular/core';

import { ButtonModule } from 'primeng/button';

import type { ICoworkerDocumentDefinition } from '../../../../../core/interfaces/i-coworker-document';
import { createDocumentsI18n } from '../documents.i18n';

@Component({
  selector: 'app-available-document-card',
  standalone: true,
  imports: [ButtonModule],
  templateUrl: './available-document-card.html',
})
export class AvailableDocumentCard {
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
  protected readonly rulesId = computed(() =>
    `available-document-rules-${this.definition().id}`
  );

  protected toggleRules(): void {
    this.rulesExpanded.update((expanded) => !expanded);
  }
}
