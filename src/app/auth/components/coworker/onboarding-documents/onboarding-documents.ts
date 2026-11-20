import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormRecord } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { finalize, map, type Observable, type Subscription } from 'rxjs';

import { LoadingOverlay } from '../../../../common/loading-overlay/loading-overlay';
import { PdfViewerDialog } from '../../../../common/pdf-viewer-dialog/pdf-viewer-dialog';
import type { ICoworkerDocumentPortal } from '../../../../core/interfaces/i-coworker-onboarding';
import type { IPdfPreview } from '../../../../core/interfaces/i-pdf';
import { CoworkerOnboarding } from '../../../../core/services/coworker-onboarding/coworker-onboarding';
import { Platform } from '../../../../core/services/platform/platform';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import {
  COWORKER_ONBOARDING_SCOPE,
  createCoworkerOnboardingI18n,
} from '../../../../core/translations/coworker-onboarding.i18n';
import { stablePartition } from '../../../../core/utils/stable-partition';
import { CoworkerPrivateDocuments } from './coworker-private-documents/coworker-private-documents';
import { CoworkerSharedDocuments } from './coworker-shared-documents/coworker-shared-documents';
import type { DocumentFileRequest, PrivateDocumentRow } from './onboarding-document-view';

@Component({
  selector: 'app-coworker-onboarding-documents',
  imports: [
    ButtonModule,
    LoadingOverlay,
    PdfViewerDialog,
    CoworkerPrivateDocuments,
    CoworkerSharedDocuments,
  ],
  templateUrl: './onboarding-documents.html',
  providers: [provideTranslocoScope(COWORKER_ONBOARDING_SCOPE, 'common')],
})
export class OnboardingDocuments {
  private readonly api = inject(CoworkerOnboarding);
  private readonly platform = inject(Platform);
  private readonly toast = inject(UiToast);
  private readonly destroyRef = inject(DestroyRef);
  private loadRequest?: Subscription;

  protected readonly sharedView =
    inject(ActivatedRoute).snapshot.routeConfig?.path === 'shared-documents';
  protected readonly i18n = createCoworkerOnboardingI18n();
  protected readonly portal = signal<ICoworkerDocumentPortal | null>(null);
  protected readonly loading = signal(true);
  protected readonly loadFailed = signal(false);
  protected readonly activeMutationKey = signal<string | null>(null);
  protected readonly selectedFiles = signal<ReadonlyMap<string, File>>(new Map());
  protected readonly declarationControls = new FormRecord<FormControl<boolean>>({});
  protected readonly acknowledgementControls = new FormRecord<FormControl<boolean>>({});
  protected readonly acknowledgedAssignmentIds = toSignal(
    this.acknowledgementControls.valueChanges.pipe(
      map((values) => Object.keys(values).filter((assignmentId) => values[assignmentId])),
    ),
    { initialValue: [] },
  );
  protected readonly preview = signal<IPdfPreview | null>(null);
  protected readonly privateRows = computed<PrivateDocumentRow[]>(() => {
    const portal = this.portal();
    if (!portal || this.sharedView) return [];

    const latestVersions = new Map<string, number>();
    for (const { document_id, version_number } of portal.private_assignments) {
      latestVersions.set(document_id, Math.max(latestVersions.get(document_id) ?? 0, version_number));
    }

    const onboardingDocumentsAvailable = portal.onboarding !== null && portal.questionnaire_complete;
    const rows = portal.private_assignments
      .filter((document) => document.onboarding_id === null || onboardingDocumentsAvailable)
      .map((document) => ({
        document,
        historical: document.version_number <
          (latestVersions.get(document.document_id) ?? document.version_number),
      }));
    return stablePartition(rows, (row) => !row.historical);
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loadRequest?.unsubscribe();
    this.loading.set(true);
    this.loadFailed.set(false);
    this.loadRequest = this.api.getPortal().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: (portal) => {
        this.portal.set(portal);
        this.syncSelectionControls(portal);
      },
      error: () => this.loadFailed.set(true),
    });
  }

  protected selectSignedFile(assignmentId: string, files: readonly File[]): void {
    const file = files[0];
    if (!file) return;

    this.selectedFiles.update((current) => new Map(current).set(assignmentId, file));
  }

  protected uploadSigned(assignmentId: string): void {
    const declaration = this.declarationControls.controls[assignmentId];
    const file = this.selectedFiles().get(assignmentId);
    if (this.activeMutationKey() !== null || !file || !declaration?.value) return;

    this.runMutation(assignmentId, this.api.uploadSignedDocument(assignmentId, file), () => {
      this.selectedFiles.update((current) => {
        const next = new Map(current);
        next.delete(assignmentId);
        return next;
      });
      declaration.reset();
    });
  }

  protected acknowledge(): void {
    const assignmentIds = this.acknowledgedAssignmentIds();
    if (this.activeMutationKey() !== null || !assignmentIds.length) return;

    this.runMutation('acknowledge', this.api.acknowledgeDocuments(assignmentIds), () => {
      this.acknowledgementControls.reset();
    });
  }

  protected openDocument({ assignmentId, target, preview }: DocumentFileRequest): void {
    this.api.getDownload(assignmentId, target).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: ({ url, filename }) => {
        if (preview) {
          this.preview.set({ url, title: filename });
        } else {
          this.platform.openNewTab(url);
        }
      },
      error: () => this.toast.danger({
        summary: this.i18n.toast().downloadFailedSummary,
        detail: this.i18n.toast().downloadFailedDetail,
      }),
    });
  }

  private syncSelectionControls(portal: ICoworkerDocumentPortal): void {
    const currentPrivate = this.privateRows().filter((row) => !row.historical).map((row) => row.document);
    this.syncSelectionRecord(
      this.declarationControls,
      currentPrivate.filter((document) =>
        document.required_action === 'upload_signed' &&
        (document.assignment_status === 'pending' || document.assignment_status === 'rejected'),
      ).map((document) => document.assignment_id),
    );

    const pendingAcknowledgements = this.sharedView
      ? portal.shared_assignments
      : currentPrivate.filter((document) => document.required_action === 'acknowledge');
    this.syncSelectionRecord(
      this.acknowledgementControls,
      pendingAcknowledgements
        .filter((document) => document.assignment_status === 'pending')
        .map((document) => document.assignment_id),
    );
  }

  private syncSelectionRecord(
    form: FormRecord<FormControl<boolean>>,
    assignmentIds: readonly string[],
  ): void {
    const currentAssignmentIds = new Set(assignmentIds);

    for (const assignmentId of Object.keys(form.controls)) {
      if (!currentAssignmentIds.has(assignmentId)) {
        form.removeControl(assignmentId, { emitEvent: false });
      }
    }

    for (const assignmentId of assignmentIds) {
      if (!form.controls[assignmentId]) {
        form.addControl(
          assignmentId,
          new FormControl(false, { nonNullable: true }),
          { emitEvent: false },
        );
      }
    }

    form.updateValueAndValidity();
  }

  private runMutation(key: string, request: Observable<unknown>, after: () => void): void {
    this.activeMutationKey.set(key);
    request.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.activeMutationKey.set(null)),
    ).subscribe({
      next: () => {
        after();
        this.toast.success({
          summary: this.i18n.toast().mutationSuccessSummary,
          detail: this.i18n.commonStatus().changesSaved,
        });
        this.load();
      },
      error: () => this.toast.danger({
        summary: this.i18n.toast().mutationFailedSummary,
        detail: this.i18n.toast().mutationFailedDetail,
      }),
    });
  }
}
