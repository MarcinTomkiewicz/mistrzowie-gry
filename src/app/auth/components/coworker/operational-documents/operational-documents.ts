import { HttpStatusCode } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { finalize } from 'rxjs';

import { ICoworkerOperationalAssignment, ICoworkerOperationalPortal } from '../../../../core/interfaces/i-coworker-operational-document';
import {
  canPerformCoworkerOperationalAction,
  compareCoworkerOperationalAssignments,
} from '../../../../core/domain/coworker-operational-documents/assignments';
import { CoworkerOperationalDocuments as OperationalDocumentsApi } from '../../../../core/services/coworker-operational-documents/coworker-operational-documents';
import { Platform } from '../../../../core/services/platform/platform';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import {
  COWORKER_OPERATIONAL_ERROR_CODE,
  CoworkerOperationalAction,
  RecordCoworkerOperationalActionRequest,
} from '../../../../core/types/coworker-operational-document';
import { EdgeFunctionError } from '../../../../core/types/edge-function-error';
import {
  isEdgeAccessError,
  normalizeEdgeFunctionError,
} from '../../../../core/utils/edge-function-error-mapping';
import { ContextHelp } from '../../../../public/common/context-help/context-help';
import { LoadingOverlay } from '../../../../public/common/loading-overlay/loading-overlay';
import { CoworkerNotifications } from '../notifications/coworker-notifications';
import { OperationalActionDialog } from './operational-action-dialog/operational-action-dialog';
import { OperationalAssignmentCard } from './operational-assignment-card/operational-assignment-card';
import {
  COWORKER_OPERATIONAL_DOCUMENTS_SCOPE,
  createOperationalDocumentsI18n,
} from './operational-documents.i18n';

@Component({
  selector: 'app-operational-documents',
  standalone: true,
  imports: [
    ButtonModule,
    ContextHelp,
    CoworkerNotifications,
    LoadingOverlay,
    OperationalActionDialog,
    OperationalAssignmentCard,
  ],
  templateUrl: './operational-documents.html',
  providers: [
    provideTranslocoScope(COWORKER_OPERATIONAL_DOCUMENTS_SCOPE, 'common'),
  ],
})
export class OperationalDocuments {
  private readonly api = inject(OperationalDocumentsApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platform = inject(Platform);
  private readonly toast = inject(UiToast);

  protected readonly i18n = createOperationalDocumentsI18n();
  protected readonly portal = signal<ICoworkerOperationalPortal | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly actionBusy = signal(false);
  protected readonly downloadingVersionId = signal<string | null>(null);
  protected readonly activeNotificationId = signal<string | null>(null);
  protected readonly selectedAssignmentId = signal<string | null>(null);
  protected readonly selectedAction = signal<CoworkerOperationalAction | null>(null);
  protected readonly loadError = signal<EdgeFunctionError | null>(null);
  protected readonly actionError = signal<EdgeFunctionError | null>(null);
  protected readonly downloadError = signal<EdgeFunctionError | null>(null);
  protected readonly notificationError = signal<EdgeFunctionError | null>(null);

  protected readonly currentAssignments = computed(() =>
    this.portal()?.assignments.filter(
      (assignment) => assignment.isCurrentPublishedVersion,
    ) ?? [],
  );
  protected readonly historicalAssignments = computed(() =>
    this.portal()?.assignments.filter(
      (assignment) => !assignment.isCurrentPublishedVersion,
    ) ?? [],
  );
  protected readonly selectedAssignment = computed(() => {
    const assignmentId = this.selectedAssignmentId();
    return assignmentId === null
      ? null
      : this.portal()?.assignments.find(
          (assignment) => assignment.id === assignmentId,
        ) ?? null;
  });
  protected readonly pageError = computed(
    () => this.loadError() ?? this.notificationError() ?? this.downloadError(),
  );
  protected readonly isAccessBlocked = computed(() =>
    isEdgeAccessError(this.pageError()) ||
    isEdgeAccessError(this.actionError()),
  );
  protected readonly isBusy = computed(() =>
    this.isLoading() ||
    this.actionBusy() ||
    this.downloadingVersionId() !== null ||
    this.activeNotificationId() !== null,
  );
  protected readonly commandsDisabled = computed(
    () => this.isBusy() || this.isAccessBlocked(),
  );
  protected readonly actionErrorDescription = computed(() => {
    const error = this.actionError();
    if (error?.code === COWORKER_OPERATIONAL_ERROR_CODE.conflict) {
      return this.i18n.errors().conflictDescription;
    }
    if (error?.code === COWORKER_OPERATIONAL_ERROR_CODE.notFound) {
      return this.i18n.errors().notFoundDescription;
    }
    if (error?.code === COWORKER_OPERATIONAL_ERROR_CODE.invalidState) {
      return this.i18n.errors().stateInvalidDescription;
    }
    return this.i18n.errors().actionDescription;
  });
  protected readonly pageErrorTitle = computed(() => {
    const error = this.pageError();
    if (error?.status === HttpStatusCode.Unauthorized) return this.i18n.errors().sessionTitle;
    if (error?.status === HttpStatusCode.Forbidden) return this.i18n.errors().unauthorizedTitle;
    if (this.loadError()) return this.i18n.errors().loadTitle;
    if (this.notificationError()) return this.i18n.errors().notificationTitle;
    return this.i18n.errors().downloadTitle;
  });
  protected readonly pageErrorDescription = computed(() => {
    const error = this.pageError();
    if (error?.status === HttpStatusCode.Unauthorized) return this.i18n.errors().sessionDescription;
    if (error?.status === HttpStatusCode.Forbidden) return this.i18n.errors().unauthorizedDescription;
    if (this.loadError()) return this.i18n.errors().loadDescription;
    if (this.notificationError()) return this.i18n.errors().notificationDescription;
    if (error?.code === 'EDGE_INVALID_SUCCESS_RESPONSE') {
      return this.i18n.errors().invalidDownloadResponse;
    }
    if (error?.status === HttpStatusCode.BadGateway) return this.i18n.errors().storageDescription;
    if (error?.code === COWORKER_OPERATIONAL_ERROR_CODE.conflict) {
      return this.i18n.errors().conflictDescription;
    }
    if (error?.code === COWORKER_OPERATIONAL_ERROR_CODE.notFound) {
      return this.i18n.errors().notFoundDescription;
    }
    return this.i18n.errors().downloadDescription;
  });

  constructor() {
    this.loadPortal();
  }

  protected loadPortal(recovery = false): void {
    if (this.isLoading()) return;
    this.isLoading.set(true);
    this.loadError.set(null);
    if (!recovery) this.clearCommandErrors();

    this.api.getPortal().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.isLoading.set(false)),
    ).subscribe({
      next: (portal) => {
        this.portal.set(portal);
        this.clearCommandErrors();
      },
      error: (error: unknown) => {
        this.portal.set(null);
        this.loadError.set(this.normalizeError(error));
      },
    });
  }

  protected openAction(
    assignment: ICoworkerOperationalAssignment,
    action: CoworkerOperationalAction,
  ): void {
    if (
      this.commandsDisabled() ||
      !canPerformCoworkerOperationalAction(assignment, action)
    ) {
      return;
    }
    this.actionError.set(null);
    this.selectedAssignmentId.set(assignment.id);
    this.selectedAction.set(action);
  }

  protected closeAction(): void {
    if (this.actionBusy()) return;
    this.selectedAssignmentId.set(null);
    this.selectedAction.set(null);
    this.actionError.set(null);
  }

  protected recordAction(request: RecordCoworkerOperationalActionRequest): void {
    const previousAssignment = this.selectedAssignment();
    if (
      previousAssignment === null ||
      previousAssignment.id !== request.assignmentId ||
      !canPerformCoworkerOperationalAction(
        previousAssignment,
        request.documentAction,
      ) ||
      this.commandsDisabled()
    ) {
      return;
    }

    this.actionBusy.set(true);
    this.actionError.set(null);
    this.api.recordAction(request).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.actionBusy.set(false)),
    ).subscribe({
      next: (assignment) => {
        this.portal.update((portal) => portal === null ? null : ({
          ...portal,
          assignments: portal.assignments
            .map((item) => item.id === assignment.id ? assignment : item)
            .sort(compareCoworkerOperationalAssignments),
        }));
        this.toast.success({
          summary: this.i18n.messages().actionSuccessSummary,
          detail: this.actionSuccessMessage(request.documentAction),
        });
        this.selectedAssignmentId.set(null);
        this.selectedAction.set(null);
      },
      error: (error: unknown) => {
        const normalized = this.normalizeError(error);
        this.actionError.set(normalized);
        if (this.handleAccessError(normalized)) return;
        if (
          normalized.code === 'EDGE_INVALID_SUCCESS_RESPONSE' ||
          this.requiresPortalRefresh(normalized, previousAssignment.canAct)
        ) {
          this.loadPortal(true);
        }
      },
    });
  }

  protected download(assignment: ICoworkerOperationalAssignment): void {
    if (this.commandsDisabled() || !assignment.downloadAvailable) return;
    this.downloadError.set(null);
    this.downloadingVersionId.set(assignment.documentVersionId);
    this.api.downloadDocumentVersion(assignment.documentVersionId).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.downloadingVersionId.set(null)),
    ).subscribe({
      next: (response) => this.platform.openNewTab(response.download.signedUrl),
      error: (error: unknown) => {
        const normalized = this.normalizeError(error);
        this.downloadError.set(normalized);
        if (this.handleAccessError(normalized)) return;
        if (this.requiresPortalRefresh(normalized, false)) this.loadPortal(true);
      },
    });
  }

  protected markNotificationRead(notificationId: string): void {
    if (this.commandsDisabled()) return;
    this.notificationError.set(null);
    this.activeNotificationId.set(notificationId);
    this.api.markNotificationRead(notificationId).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.activeNotificationId.set(null)),
    ).subscribe({
      next: () => this.loadPortal(),
      error: (error: unknown) => {
        const normalized = this.normalizeError(error);
        this.notificationError.set(normalized);
        if (this.handleAccessError(normalized)) return;
        if (this.requiresPortalRefresh(normalized, false)) this.loadPortal(true);
      },
    });
  }

  private requiresPortalRefresh(
    error: EdgeFunctionError,
    previouslyCanAct: boolean,
  ): boolean {
    return error.code === COWORKER_OPERATIONAL_ERROR_CODE.conflict ||
      error.code === COWORKER_OPERATIONAL_ERROR_CODE.notFound ||
      (
        error.code === COWORKER_OPERATIONAL_ERROR_CODE.invalidState &&
        previouslyCanAct
      );
  }

  private handleAccessError(error: EdgeFunctionError): boolean {
    if (!isEdgeAccessError(error)) return false;
    this.portal.set(null);
    this.loadError.set(error);
    return true;
  }

  private clearCommandErrors(): void {
    this.actionError.set(null);
    this.downloadError.set(null);
    this.notificationError.set(null);
  }

  private actionSuccessMessage(action: CoworkerOperationalAction): string {
    const messages = this.i18n.messages();
    if (action === 'acknowledged') return messages.acknowledgedSuccess;
    if (action === 'accepted') return messages.acceptedSuccess;
    return messages.declinedSuccess;
  }

  private normalizeError(error: unknown): EdgeFunctionError {
    return normalizeEdgeFunctionError(
      error,
      this.i18n.errors().unexpectedDescription,
    );
  }
}
