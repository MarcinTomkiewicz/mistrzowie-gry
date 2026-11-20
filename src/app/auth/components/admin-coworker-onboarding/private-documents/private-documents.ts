import {
  Component, computed, DestroyRef, inject, input, output, signal, viewChild,
  type OnChanges, type SimpleChanges,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';

import type {
  IAdminCoworkerDocumentCategory,
  IAdminCoworkerOnboardingDetail,
  IAdminCoworkerOnboardingDocument,
  IAdminPrivateDocumentUpload,
} from '../../../../core/interfaces/i-admin-coworker-onboarding';
import { UiConfirm } from '../../../../core/services/ui-confirm/ui-confirm';
import { createCoworkerOnboardingI18n } from '../../../../core/translations/coworker-onboarding.i18n';
import type { CoworkerDocumentReviewDecision } from '../../../../core/types/coworker-onboarding';
import { isCurrentDocumentVersion } from '../document-version';
import { PrivateDocumentBatch } from '../private-document-batch/private-document-batch';
import {
  PrivateDocumentEditor,
  type PrivateDocumentEditKind,
} from '../private-document-editor/private-document-editor';
import {
  PrivateDocumentList,
  type PrivateDocumentOperation,
} from '../private-document-list/private-document-list';

export type PrivateDocumentFileOperation = Extract<PrivateDocumentOperation, { kind: 'preview' | 'download' }>;

export type PrivateDocumentMutation =
  | { kind: 'upload'; documents: readonly IAdminPrivateDocumentUpload[] }
  | { kind: 'remove'; documentId: string }
  | { kind: 'review'; assignmentId: string; decision: CoworkerDocumentReviewDecision; reason: string | null }
  | { kind: 'reclassify'; documentId: string; categoryKey: string };

@Component({
  selector: 'app-admin-private-documents',
  imports: [ButtonModule, PrivateDocumentBatch, PrivateDocumentEditor, PrivateDocumentList],
  templateUrl: './private-documents.html',
  host: { class: 'flex-col-start-stretch gap-lg w-100 min-w-0' },
})
export class PrivateDocuments implements OnChanges {
  private readonly confirm = inject(UiConfirm);
  private readonly destroyRef = inject(DestroyRef);
  private readonly batch = viewChild(PrivateDocumentBatch);

  readonly detail = input.required<IAdminCoworkerOnboardingDetail>();
  readonly categories = input.required<readonly IAdminCoworkerDocumentCategory[]>();
  readonly categoryLoading = input.required<boolean>();
  readonly categoryLoadFailed = input.required<boolean>();
  readonly loading = input.required<boolean>();
  readonly saving = input.required<boolean>();

  readonly retryCategories = output<void>();
  readonly fileRequested = output<PrivateDocumentFileOperation>();
  readonly mutationRequested = output<PrivateDocumentMutation>();

  protected readonly i18n = createCoworkerOnboardingI18n();
  protected readonly onboarding = computed(() => this.detail().onboarding);
  protected readonly canUpload = computed(() => {
    const { status } = this.onboarding();
    return status === 'in_progress' || status === 'completed';
  });
  protected readonly busy = computed(() => this.loading() || this.saving());
  protected readonly activeCategories = computed(() =>
    this.categoryLoadFailed() ? [] : this.categories().filter(({ status }) => status === 'active'),
  );
  protected readonly canReclassify = computed(() =>
    this.canUpload() && !this.categoryLoading() && this.activeCategories().length > 0,
  );
  protected readonly editor = signal<{
    kind: PrivateDocumentEditKind;
    document: IAdminCoworkerOnboardingDocument;
  } | null>(null);

  ngOnChanges(changes: SimpleChanges<PrivateDocuments>): void {
    const change = changes.detail;
    if (change && !change.firstChange &&
        change.previousValue.onboarding.onboarding_id !== change.currentValue.onboarding.onboarding_id) {
      this.editor.set(null);
      this.batch()?.reset();
    }
  }

  protected onOperation(operation: PrivateDocumentOperation): void {
    const { kind, document } = operation;
    if (kind === 'preview' || kind === 'download') {
      this.fileRequested.emit(operation);
      return;
    }
    if (this.busy() || !isCurrentDocumentVersion(document)) return;

    if (kind === 'remove') {
      if (this.onboarding().status === 'in_progress' && document.source === 'uploaded') {
        this.confirmRemove(document.document_id);
      }
    } else if (kind === 'reclassify') {
      if (this.canReclassify() && document.category !== null && document.document_status === 'active') {
        this.editor.set({ kind, document });
      }
    } else if (document.assignment_id && document.assignment_status === 'submitted') {
      if (kind === 'accept') {
        this.requestReview(document.assignment_id, 'accepted', null);
      } else {
        this.editor.set({ kind, document });
      }
    }
  }

  protected saveDocumentChange(value: string): void {
    const editor = this.editor();
    if (!editor || this.busy()) return;

    if (editor.kind === 'reject') {
      if (editor.document.assignment_id) {
        this.requestReview(editor.document.assignment_id, 'rejected', value);
      }
    } else if (this.canReclassify()) {
      this.mutationRequested.emit({
        kind: 'reclassify', documentId: editor.document.document_id, categoryKey: value,
      });
    }
  }

  protected upload(documents: readonly IAdminPrivateDocumentUpload[]): void {
    if (!this.busy() && this.canUpload()) {
      this.mutationRequested.emit({ kind: 'upload', documents });
    }
  }

  mutationSucceeded(kind: PrivateDocumentMutation['kind']): void {
    if (kind === 'upload') this.batch()?.reset();
    if (kind === 'review' || kind === 'reclassify') this.editor.set(null);
  }

  private confirmRemove(documentId: string): void {
    const { onboarding_id } = this.onboarding();
    this.confirm.modalDecision({
      header: this.i18n.actions().removeDocument,
      message: this.i18n.dialogs().removeMessage,
      acceptLabel: this.i18n.commonActions().delete,
      rejectLabel: this.i18n.commonActions().cancel,
      acceptSeverity: 'danger',
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((accepted) => {
      if (accepted && !this.busy() && this.onboarding().onboarding_id === onboarding_id) {
        this.mutationRequested.emit({ kind: 'remove', documentId });
      }
    });
  }

  private requestReview(
    assignmentId: string,
    decision: CoworkerDocumentReviewDecision,
    reason: string | null,
  ): void {
    this.mutationRequested.emit({ kind: 'review', assignmentId, decision, reason });
  }
}
