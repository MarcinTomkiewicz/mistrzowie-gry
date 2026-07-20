import { Component, input } from '@angular/core';

import { EdgeFunctionError } from '../../../../core/types/edge-function-error';
import { createAdminCoworkerDocumentsI18n } from '../private-documents/private-documents.i18n';

@Component({
  selector: 'app-admin-coworker-document-error',
  standalone: true,
  templateUrl: './admin-coworker-document-error.html',
})
export class AdminCoworkerDocumentError {
  readonly error = input.required<EdgeFunctionError>();
  readonly description = input.required<string>();

  protected readonly i18n = createAdminCoworkerDocumentsI18n();
}
