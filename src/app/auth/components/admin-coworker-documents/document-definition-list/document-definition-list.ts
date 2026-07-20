import { Component, computed, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';

import { IAdminCoworkerDocumentDefinition } from '../../../../core/interfaces/i-admin-coworker-document';
import { createAdminCoworkerDocumentsI18n } from '../private-documents/private-documents.i18n';

@Component({
  selector: 'app-document-definition-list',
  standalone: true,
  imports: [ButtonModule, TableModule],
  templateUrl: './document-definition-list.html',
})
export class DocumentDefinitionList {
  readonly definitions = input.required<readonly IAdminCoworkerDocumentDefinition[]>();
  readonly disabled = input(false);
  readonly edit = output<IAdminCoworkerDocumentDefinition>();

  protected readonly i18n = createAdminCoworkerDocumentsI18n();
  protected readonly rows = computed(() => [...this.definitions()]);
}
