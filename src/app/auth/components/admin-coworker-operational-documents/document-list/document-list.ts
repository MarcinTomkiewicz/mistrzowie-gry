import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { finalize } from 'rxjs';

import { IAdminOperationalDashboard } from '../../../../core/interfaces/i-admin-operational-document';
import { AdminCoworkerOperationalDocuments } from '../../../../core/services/admin-coworker-operational-documents/admin-coworker-operational-documents';
import { EdgeFunctionError } from '../../../../core/types/edge-function-error';
import { AdminOperationalTableCopy } from '../../../../core/types/i18n/admin-coworker-operational-document';
import {
  isEdgeAccessError,
  normalizeEdgeFunctionError,
} from '../../../../core/utils/edge-function-error-mapping';
import { ContextHelp } from '../../../../public/common/context-help/context-help';
import { LoadingOverlay } from '../../../../public/common/loading-overlay/loading-overlay';
import { resolveAdminOperationalError } from '../admin-operational-document-errors';
import { createAdminOperationalDocumentsI18n } from '../admin-operational-documents.i18n';
import { DocumentTable } from '../document-table/document-table';

@Component({
  selector: 'app-admin-operational-document-list',
  standalone: true,
  imports: [RouterLink, ButtonModule, ContextHelp, LoadingOverlay, DocumentTable],
  templateUrl: './document-list.html',
  providers: [
    provideTranslocoScope('adminCoworkerOperationalDocuments', 'common'),
  ],
})
export class DocumentList {
  private readonly documents = inject(AdminCoworkerOperationalDocuments);

  protected readonly i18n = createAdminOperationalDocumentsI18n();
  protected readonly dashboard = signal<IAdminOperationalDashboard | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly loadError = signal<EdgeFunctionError | null>(null);
  protected readonly tableCopy = computed<AdminOperationalTableCopy>(() => ({
    fields: this.i18n.fields(),
    actions: this.i18n.actions(),
    tooltips: this.i18n.tooltips(),
    statuses: this.i18n.statuses(),
    values: this.i18n.commonValues(),
    contextHelpLabel: this.i18n.contextHelpLabel,
  }));
  protected readonly isAccessBlocked = computed(() =>
    isEdgeAccessError(this.loadError()),
  );
  protected readonly loadErrorDescription = computed(() => {
    const error = this.loadError();
    return error
      ? resolveAdminOperationalError(
          error,
          this.i18n.errors(),
          this.i18n.errors().load,
        )
      : '';
  });

  constructor() {
    this.loadDashboard();
  }

  protected loadDashboard(): void {
    this.isLoading.set(true);
    this.loadError.set(null);
    this.documents
      .getDashboard()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (dashboard) => this.dashboard.set(dashboard),
        error: (error) => {
          this.dashboard.set(null);
          this.loadError.set(
            normalizeEdgeFunctionError(error, this.i18n.errors().load),
          );
        },
      });
  }
}
