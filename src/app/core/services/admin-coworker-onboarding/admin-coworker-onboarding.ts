import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { COWORKER_EDGE_FUNCTION } from '../../configs/coworker-edge-functions.config';
import type {
  IAdminCoworkerOnboardingCandidate,
  IAdminCoworkerOnboardingDetail,
  IAdminCoworkerOnboardingRow,
  IAdminPrivateDocumentUpload,
  IAdminSharedDocument,
  IAdminSharedDocumentAssignment,
  IArchiveSharedDocumentResult,
  ICompleteCoworkerOnboardingResult,
  IRegisterAdminPrivateDocumentResult,
  IRegisterSharedDocumentResult,
  IRemovePrivateDocumentResult,
  IReviewCoworkerSignedSubmissionResult,
  IStartCoworkerOnboardingResult,
} from '../../interfaces/i-admin-coworker-onboarding';
import type {
  ICoworkerDocumentDownload,
  ICoworkerDocumentEdgeResponse,
} from '../../interfaces/i-coworker-onboarding';
import type { CoworkerDocumentReviewDecision } from '../../types/coworker-onboarding';
import { Backend } from '../backend/backend';

@Injectable({ providedIn: 'root' })
export class AdminCoworkerOnboarding {
  private readonly backend = inject(Backend);

  getOnboardingCandidates(): Observable<
    readonly IAdminCoworkerOnboardingCandidate[]
  > {
    return this.invoke({ action: 'listOnboardingCandidates' });
  }

  getOnboardings(): Observable<readonly IAdminCoworkerOnboardingRow[]> {
    return this.invoke({ action: 'listOnboardings' });
  }

  getOnboarding(
    onboardingId: string,
  ): Observable<IAdminCoworkerOnboardingDetail> {
    return this.invoke({
      action: 'getOnboarding',
      onboarding_id: onboardingId,
    });
  }

  startOnboarding(userId: string): Observable<IStartCoworkerOnboardingResult> {
    return this.invoke({ action: 'startOnboarding', user_id: userId });
  }

  uploadPrivateDocuments(
    onboardingId: string,
    documents: readonly IAdminPrivateDocumentUpload[],
  ): Observable<readonly IRegisterAdminPrivateDocumentResult[]> {
    const body = new FormData();
    body.append('action', 'uploadPrivateDocuments');
    body.append('onboarding_id', onboardingId);
    body.append(
      'documents',
      JSON.stringify(
        documents.map(({ title, requires_signed_upload }) => ({
          title,
          requires_signed_upload,
        })),
      ),
    );
    documents.forEach(({ file }) => body.append('files', file));
    return this.invoke(body);
  }

  removePrivateDocument(
    documentId: string,
  ): Observable<Omit<IRemovePrivateDocumentResult, 'storage_paths'>> {
    return this.invoke({
      action: 'removePrivateDocument',
      document_id: documentId,
    });
  }

  reviewSignedDocument(
    assignmentId: string,
    decision: CoworkerDocumentReviewDecision,
    rejectionReason: string | null,
  ): Observable<Omit<IReviewCoworkerSignedSubmissionResult, 'signed_storage_path'>> {
    return this.invoke({
      action: 'reviewSignedDocument',
      assignment_id: assignmentId,
      decision,
      rejection_reason: rejectionReason,
    });
  }

  completeOnboarding(
    onboardingId: string,
  ): Observable<ICompleteCoworkerOnboardingResult> {
    return this.invoke({
      action: 'completeOnboarding',
      onboarding_id: onboardingId,
    });
  }

  getSharedDocuments(): Observable<readonly IAdminSharedDocument[]> {
    return this.invoke({ action: 'listSharedDocuments' });
  }

  uploadSharedDocument(
    documentId: string | null,
    title: string,
    assignAfterOnboarding: boolean,
    file: File,
  ): Observable<IRegisterSharedDocumentResult> {
    const body = new FormData();
    body.append('action', 'uploadSharedDocument');
    body.append('document_id', documentId ?? '');
    body.append('title', title);
    body.append('assign_after_onboarding', String(assignAfterOnboarding));
    body.append('file', file);
    return this.invoke(body);
  }

  archiveSharedDocument(
    documentId: string,
  ): Observable<IArchiveSharedDocumentResult> {
    return this.invoke({
      action: 'archiveSharedDocument',
      document_id: documentId,
    });
  }

  getSharedDocumentAssignments(
    documentId: string,
  ): Observable<readonly IAdminSharedDocumentAssignment[]> {
    return this.invoke({
      action: 'listSharedDocumentAssignments',
      document_id: documentId,
    });
  }

  getSourceDownload(
    documentId: string,
    onboardingId: string | null,
  ): Observable<ICoworkerDocumentDownload> {
    return this.invoke({
      action: 'getDownloadUrl',
      target: 'source',
      document_id: documentId,
      onboarding_id: onboardingId,
    });
  }

  getSignedDownload(
    assignmentId: string,
    onboardingId: string,
  ): Observable<ICoworkerDocumentDownload> {
    return this.invoke({
      action: 'getDownloadUrl',
      target: 'signed',
      assignment_id: assignmentId,
      onboarding_id: onboardingId,
    });
  }

  private invoke<TResult, TBody>(body: TBody): Observable<TResult> {
    return this.backend
      .invokeEdge<ICoworkerDocumentEdgeResponse<TResult>, TBody>(
        COWORKER_EDGE_FUNCTION.adminDocuments,
        { method: 'POST', body },
      )
      .pipe(map((response) => response.data));
  }
}
