import { HttpStatusCode } from '@angular/common/http';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { IftaLabelModule } from 'primeng/iftalabel';
import { SelectModule } from 'primeng/select';
import { finalize } from 'rxjs';

import { STATUS_BADGE_CLASS } from '../../../../core/configs/badge-class.config';
import {
  IAdminCoworkerCatalogEntry,
  IAdminCoworkerDocumentDefinition,
  IAdminCoworkerDocumentsDashboard,
  IAdminCoworkerOnboardingResult,
} from '../../../../core/interfaces/i-admin-coworker-document';
import { AdminCoworkerDocuments } from '../../../../core/services/admin-coworker-documents/admin-coworker-documents';
import { UiConfirm } from '../../../../core/services/ui-confirm/ui-confirm';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import {
  ADMIN_COWORKER_DOCUMENT_ACTION,
  ADMIN_COWORKER_DOCUMENT_ERROR_CODE,
  AdminCoworkerDocumentAction,
} from '../../../../core/types/admin-coworker-document';
import { EdgeFunctionError } from '../../../../core/types/edge-function-error';
import { formatTimestampLabel } from '../../../../core/utils/date';
import {
  isEdgeAccessError,
  normalizeEdgeFunctionError,
} from '../../../../core/utils/edge-function-error-mapping';
import { setControlEnabled } from '../../../../core/utils/form-controls';
import { ContextHelp } from '../../../../public/common/context-help/context-help';
import { LoadingOverlay } from '../../../../public/common/loading-overlay/loading-overlay';
import {
  isAdminCoworkerDocumentStaleError,
  resolveAdminCoworkerDocumentError,
} from '../admin-coworker-document-errors';
import { AdminCoworkerDocumentError } from '../admin-coworker-document-error/admin-coworker-document-error';
import { DocumentDefinitionEditor } from '../document-definition-editor/document-definition-editor';
import { DocumentDefinitionList } from '../document-definition-list/document-definition-list';
import { RequirementEditor } from '../requirement-editor/requirement-editor';
import { ReviewQueue } from '../review-queue/review-queue';
import { createAdminCoworkerDocumentsI18n } from './private-documents.i18n';

@Component({
  selector: 'app-private-documents',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    IftaLabelModule,
    SelectModule,
    ContextHelp,
    LoadingOverlay,
    DocumentDefinitionEditor,
    DocumentDefinitionList,
    RequirementEditor,
    ReviewQueue,
    AdminCoworkerDocumentError,
  ],
  templateUrl: './private-documents.html',
  providers: [provideTranslocoScope('adminCoworkerDocuments', 'common')],
})
export class PrivateDocuments {
  private readonly documents = inject(AdminCoworkerDocuments);
  private readonly confirm = inject(UiConfirm);
  private readonly toast = inject(UiToast);
  private replaceEditedDefinitionOnNextSuccessfulLoad = false;

  protected readonly i18n = createAdminCoworkerDocumentsI18n();
  protected readonly resolveError = resolveAdminCoworkerDocumentError;
  protected readonly ADMIN_COWORKER_DOCUMENT_ACTION = ADMIN_COWORKER_DOCUMENT_ACTION;
  protected readonly STATUS_BADGE_CLASS = STATUS_BADGE_CLASS;
  protected readonly formatTimestampLabel = formatTimestampLabel;
  protected readonly dashboard = signal<IAdminCoworkerDocumentsDashboard | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly loadError = signal<EdgeFunctionError | null>(null);
  protected readonly actionError = signal<EdgeFunctionError | null>(null);
  protected readonly actionErrorFallback = signal('');
  protected readonly activeAction = signal<AdminCoworkerDocumentAction | null>(null);
  protected readonly definitionBusy = signal(false);
  protected readonly requirementBusy = signal(false);
  protected readonly onboarding = signal<IAdminCoworkerOnboardingResult | null>(null);
  protected readonly lastSeededCount = signal<number | null>(null);
  protected readonly editorOpen = signal(false);
  protected readonly editedDefinition = signal<IAdminCoworkerDocumentDefinition | null>(null);
  protected readonly coworkerControl = new FormControl<string | null>(null);
  private readonly selectedCoworkerId = toSignal(
    this.coworkerControl.valueChanges,
    { initialValue: this.coworkerControl.value },
  );

  protected readonly selectedCoworker = computed<IAdminCoworkerCatalogEntry | null>(
    () => this.dashboard()?.catalog.coworkers.find((coworker) =>
      coworker.userId === this.selectedCoworkerId()) ?? null,
  );
  protected readonly onboardingCaseId = computed(() => this.onboarding()?.case.id ?? null);
  protected readonly coworkerOptions = computed(() =>
    (this.dashboard()?.catalog.coworkers ?? []).map((coworker) => ({
      value: coworker.userId,
      label: `${coworker.displayName} - ${coworker.email}${coworker.accessEnabled
        ? ''
        : ` - ${this.i18n.statuses().accessDisabled}`}`,
    })),
  );
  protected readonly isActionBusy = computed(() => this.activeAction() !== null || this.definitionBusy() || this.requirementBusy());
  protected readonly interactionsBlocked = computed(() => this.isLoading() || this.isActionBusy() || this.loadError() !== null);
  protected readonly isEdgeAccessError = isEdgeAccessError;

  constructor() {
    effect(() => setControlEnabled(this.coworkerControl, !this.interactionsBlocked()));
    this.coworkerControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.onboarding.set(null);
        this.lastSeededCount.set(null);
        this.actionError.set(null);
        this.actionErrorFallback.set('');
      });
    this.loadDashboard();
  }

  protected loadDashboard(): void {
    this.requestDashboard();
  }

  protected handleDefinitionReload(error: EdgeFunctionError): void {
    if (error.code === ADMIN_COWORKER_DOCUMENT_ERROR_CODE.concurrentModification) {
      this.replaceEditedDefinitionOnNextSuccessfulLoad = true;
    }
    this.requestDashboard();
  }

  protected handleRequirementReload(error: EdgeFunctionError): void {
    if (isAdminCoworkerDocumentStaleError(error)) {
      this.reloadAfterStaleOnboarding();
      return;
    }
    this.loadDashboard();
  }

  private requestDashboard(): void {
    const editedId = this.editedDefinition()?.id ?? null;
    this.isLoading.set(true);
    this.loadError.set(null);

    this.documents
      .getDashboard()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (dashboard) => {
          this.dashboard.set(dashboard);
          if (
            this.coworkerControl.value !== null &&
            !dashboard.catalog.coworkers.some(
              (coworker) => coworker.userId === this.coworkerControl.value,
            )
          ) {
            this.coworkerControl.setValue(null);
          }
          if (this.editorOpen() && editedId !== null) {
            const refreshed = dashboard.catalog.documentDefinitions.find(
              (definition) => definition.id === editedId,
            );
            if (!refreshed) {
              this.closeDefinitionEditor();
            } else if (this.replaceEditedDefinitionOnNextSuccessfulLoad) {
              this.editedDefinition.set(refreshed);
            }
          }
          this.replaceEditedDefinitionOnNextSuccessfulLoad = false;
        },
        error: (error) => {
          const normalized = normalizeEdgeFunctionError(error, this.i18n.errors().load);
          if (isEdgeAccessError(normalized)) {
            this.handleAccessError(normalized);
            return;
          }
          this.loadError.set(normalized);
        },
      });
  }

  protected openNewDefinition(): void {
    this.editedDefinition.set(null);
    this.editorOpen.set(true);
  }

  protected editDefinition(definition: IAdminCoworkerDocumentDefinition): void {
    this.editedDefinition.set(definition);
    this.editorOpen.set(true);
  }

  protected closeDefinitionEditor(): void {
    this.editorOpen.set(false);
    this.editedDefinition.set(null);
  }

  protected onDefinitionSaved(): void {
    this.closeDefinitionEditor();
    this.toast.success({
      summary: this.i18n.messages().actionSuccessSummary,
      detail: this.i18n.messages().definitionSaved,
    });
    this.loadDashboard();
  }

  protected ensureOnboarding(): void {
    const coworker = this.selectedCoworker();
    if (!coworker?.accessEnabled || this.interactionsBlocked()) return;

    this.startAction(ADMIN_COWORKER_DOCUMENT_ACTION.ensureOnboarding);
    this.documents
      .ensureOnboarding(coworker.userId)
      .pipe(finalize(() => this.activeAction.set(null)))
      .subscribe({
        next: (result) => {
          this.onboarding.set(result);
          this.toast.success({
            summary: this.i18n.messages().actionSuccessSummary,
            detail: this.i18n.messages().onboardingEnsured,
          });
          this.loadDashboard();
        },
        error: (error) =>
          this.handleActionError(error, this.i18n.errors().ensureOnboarding),
      });
  }

  protected confirmSeedDefaults(event: Event): void {
    if (!this.onboarding() || !this.selectedCoworker()?.accessEnabled || this.interactionsBlocked()) return;
    this.confirm.decision(event, {
      message: this.i18n.messages().seedConfirmation,
      acceptLabel: this.i18n.actions().seedDefaults,
      rejectLabel: this.i18n.commonActions().cancel,
      accept: () => this.seedDefaultRequirements(),
    });
  }

  protected onRequirementAssigned(): void {
    this.toast.success({
      summary: this.i18n.messages().actionSuccessSummary,
      detail: this.i18n.messages().requirementAssigned,
    });
    this.loadDashboard();
  }

  protected reloadAfterStaleOnboarding(): void {
    this.onboarding.set(null);
    this.lastSeededCount.set(null);
    this.loadDashboard();
  }

  protected handleAccessError(error: EdgeFunctionError): void {
    this.replaceEditedDefinitionOnNextSuccessfulLoad = false;
    this.dashboard.set(null);
    this.loadError.set(error);
    this.actionError.set(null);
    this.actionErrorFallback.set('');
    this.onboarding.set(null);
    this.lastSeededCount.set(null);
    this.definitionBusy.set(false);
    this.requirementBusy.set(false);
  }

  private seedDefaultRequirements(): void {
    const coworker = this.selectedCoworker();
    const onboarding = this.onboarding();
    if (!coworker?.accessEnabled || !onboarding || this.interactionsBlocked()) return;

    this.startAction(ADMIN_COWORKER_DOCUMENT_ACTION.seedDefaultRequirements);
    this.documents
      .seedDefaultRequirements(coworker.userId, onboarding.case.id)
      .pipe(finalize(() => this.activeAction.set(null)))
      .subscribe({
        next: (result) => {
          this.lastSeededCount.set(result.insertedCount);
          this.toast.success({
            summary: this.i18n.messages().actionSuccessSummary,
            detail: this.i18n.messages().defaultsSeeded.replace(
              '{count}',
              String(result.insertedCount),
            ),
          });
          this.loadDashboard();
        },
        error: (error) =>
          this.handleActionError(error, this.i18n.errors().seedDefaults),
      });
  }

  private startAction(action: AdminCoworkerDocumentAction): void {
    this.activeAction.set(action);
    this.actionError.set(null);
    this.actionErrorFallback.set('');
  }

  private handleActionError(error: unknown, fallback: string): void {
    const normalized = normalizeEdgeFunctionError(error, fallback);
    if (isEdgeAccessError(normalized)) {
      this.handleAccessError(normalized);
      return;
    }
    this.actionErrorFallback.set(fallback);
    this.actionError.set(normalized);
    if (
      normalized.status === HttpStatusCode.NotFound ||
      normalized.status === HttpStatusCode.Conflict
    ) {
      if (isAdminCoworkerDocumentStaleError(normalized)) {
        this.reloadAfterStaleOnboarding();
        return;
      }
      this.loadDashboard();
    }
  }
}
