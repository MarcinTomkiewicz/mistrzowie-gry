import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { COWORKER_EDGE_FUNCTION } from '../../configs/coworker-edge-functions.config';
import {
  createAdminDocumentDownloadReader,
  createAdminDocumentMutationReader,
  createAdminSignatureVerificationReader,
} from '../../contracts/admin-coworker-documents/admin-coworker-document-actions.contract';
import {
  createAssignedRequirementReader,
  createEnsureOnboardingReader,
  createSavedDefinitionReader,
  createSeedRequirementsReader,
  parseAdminCoworkerDocumentsDashboard,
} from '../../contracts/admin-coworker-documents/admin-coworker-documents.contract';
import { createAdminCoworkerReviewDetailReader } from '../../contracts/admin-coworker-documents/admin-coworker-review.contract';
import {
  createDeletionCapabilitiesResponseReader,
  createDocumentDeletionReader,
  createDocumentVersionDeletionReader,
  createDocumentVersionPreservationReader,
} from '../../contracts/coworker-documents/coworker-document-deletion.contract';
import {
  IAdminCoworkerDocumentReviewDetail,
  IAdminCoworkerDocumentsDashboard,
  IAdminCoworkerOnboardingResult,
  IAdminCoworkerRequirementResult,
  IAdminCoworkerSeedResult,
  IAdminCoworkerVersionDownload,
  IAdminSignatureVerification,
} from '../../interfaces/i-admin-coworker-document';
import { ICoworkerDocument, ICoworkerDocumentDefinition } from '../../interfaces/i-coworker-document';
import {
  ICoworkerDocumentDeletionCapabilities,
  ICoworkerDocumentDeletionResult,
  ICoworkerDocumentVersionDeletionResult,
  ICoworkerDocumentVersionPreservationResult,
} from '../../interfaces/i-coworker-document-deletion';
import {
  ADMIN_COWORKER_DOCUMENT_ACTION,
  AdminCoworkerAcceptDocumentPayload,
  AdminCoworkerDocumentActionRequest,
  AdminCoworkerDocumentDefinitionPayload,
  AdminCoworkerDocumentDownloadPayload,
  AdminCoworkerDocumentPreservationPayload,
  AdminCoworkerRejectDocumentPayload,
  AdminCoworkerRequirementPayload,
  AdminSignatureVerificationPayload,
} from '../../types/admin-coworker-document';
import { Backend } from '../backend/backend';

@Injectable({ providedIn: 'root' })
export class AdminCoworkerDocuments {
  private readonly backend = inject(Backend);

  getDashboard(): Observable<IAdminCoworkerDocumentsDashboard> {
    return this.backend
      .invokeEdge<unknown>(COWORKER_EDGE_FUNCTION.adminDocuments, {
        method: 'GET',
      })
      .pipe(map(parseAdminCoworkerDocumentsDashboard));
  }

  saveDefinition(
    definition: AdminCoworkerDocumentDefinitionPayload,
  ): Observable<ICoworkerDocumentDefinition> {
    const request = {
      action: ADMIN_COWORKER_DOCUMENT_ACTION.saveDefinition,
      definition,
    } satisfies AdminCoworkerDocumentActionRequest;
    return this.invoke(request, createSavedDefinitionReader(definition));
  }

  ensureOnboarding(userId: string): Observable<IAdminCoworkerOnboardingResult> {
    const request = {
      action: ADMIN_COWORKER_DOCUMENT_ACTION.ensureOnboarding,
      userId,
    } satisfies AdminCoworkerDocumentActionRequest;
    return this.invoke(request, createEnsureOnboardingReader(userId));
  }

  seedDefaultRequirements(
    userId: string,
    onboardingCaseId: string,
  ): Observable<IAdminCoworkerSeedResult> {
    const request = {
      action: ADMIN_COWORKER_DOCUMENT_ACTION.seedDefaultRequirements,
      userId,
      onboardingCaseId,
    } satisfies AdminCoworkerDocumentActionRequest;
    return this.invoke(
      request,
      createSeedRequirementsReader(userId, onboardingCaseId),
    );
  }

  assignRequirement(
    requirement: AdminCoworkerRequirementPayload,
  ): Observable<IAdminCoworkerRequirementResult> {
    const request = {
      action: ADMIN_COWORKER_DOCUMENT_ACTION.assignRequirement,
      requirement,
    } satisfies AdminCoworkerDocumentActionRequest;
    return this.invoke(request, createAssignedRequirementReader(requirement));
  }

  getReviewDetail(
    userId: string,
    documentId: string,
  ): Observable<IAdminCoworkerDocumentReviewDetail> {
    const request = {
      action: ADMIN_COWORKER_DOCUMENT_ACTION.getReviewDetail,
      userId,
      documentId,
    } satisfies AdminCoworkerDocumentActionRequest;
    return this.invoke(
      request,
      createAdminCoworkerReviewDetailReader(userId, documentId),
    );
  }

  startReview(userId: string, documentId: string): Observable<ICoworkerDocument> {
    const request = {
      action: ADMIN_COWORKER_DOCUMENT_ACTION.startReview,
      userId,
      documentId,
    } satisfies AdminCoworkerDocumentActionRequest;
    return this.invoke(
      request,
      createAdminDocumentMutationReader(
        ADMIN_COWORKER_DOCUMENT_ACTION.startReview,
        userId,
        documentId,
      ),
    );
  }

  verifySignature(
    payload: AdminSignatureVerificationPayload,
  ): Observable<IAdminSignatureVerification> {
    const request = {
      action: ADMIN_COWORKER_DOCUMENT_ACTION.verifySignature,
      ...payload,
    } satisfies AdminCoworkerDocumentActionRequest;
    return this.invoke(
      request,
      createAdminSignatureVerificationReader(
        payload.documentId,
        payload.documentVersionId,
        payload.verificationStatus,
      ),
    );
  }

  acceptDocument(
    payload: AdminCoworkerAcceptDocumentPayload,
  ): Observable<ICoworkerDocument> {
    const request = {
      action: ADMIN_COWORKER_DOCUMENT_ACTION.acceptDocument,
      ...payload,
    } satisfies AdminCoworkerDocumentActionRequest;
    return this.invoke(
      request,
      createAdminDocumentMutationReader(
        ADMIN_COWORKER_DOCUMENT_ACTION.acceptDocument,
        payload.userId,
        payload.documentId,
      ),
    );
  }

  rejectDocument(
    payload: AdminCoworkerRejectDocumentPayload,
  ): Observable<ICoworkerDocument> {
    const request = {
      action: ADMIN_COWORKER_DOCUMENT_ACTION.rejectDocument,
      ...payload,
    } satisfies AdminCoworkerDocumentActionRequest;
    return this.invoke(
      request,
      createAdminDocumentMutationReader(
        ADMIN_COWORKER_DOCUMENT_ACTION.rejectDocument,
        payload.userId,
        payload.documentId,
      ),
    );
  }

  downloadDocumentVersion(
    payload: AdminCoworkerDocumentDownloadPayload,
  ): Observable<IAdminCoworkerVersionDownload> {
    const request = {
      action: ADMIN_COWORKER_DOCUMENT_ACTION.downloadDocumentVersion,
      ...payload,
    } satisfies AdminCoworkerDocumentActionRequest;
    return this.invoke(
      request,
      createAdminDocumentDownloadReader(
        payload.documentVersionId,
        payload.purpose,
      ),
    );
  }

  getDeletionCapabilities(
    userId: string,
    documentId: string,
  ): Observable<ICoworkerDocumentDeletionCapabilities> {
    const request = {
      action: ADMIN_COWORKER_DOCUMENT_ACTION.getDeletionCapabilities,
      userId,
      documentId,
    } satisfies AdminCoworkerDocumentActionRequest;
    return this.invoke(
      request,
      createDeletionCapabilitiesResponseReader(documentId),
    );
  }

  deleteDocumentVersion(
    userId: string,
    documentId: string,
    documentVersionId: string,
  ): Observable<ICoworkerDocumentVersionDeletionResult> {
    const request = {
      action: ADMIN_COWORKER_DOCUMENT_ACTION.deleteDocumentVersion,
      userId,
      documentId,
      documentVersionId,
    } satisfies AdminCoworkerDocumentActionRequest;
    return this.invoke(
      request,
      createDocumentVersionDeletionReader(documentId, documentVersionId),
    );
  }

  deleteDocument(
    userId: string,
    documentId: string,
  ): Observable<ICoworkerDocumentDeletionResult> {
    const request = {
      action: ADMIN_COWORKER_DOCUMENT_ACTION.deleteDocument,
      userId,
      documentId,
    } satisfies AdminCoworkerDocumentActionRequest;
    return this.invoke(request, createDocumentDeletionReader(documentId));
  }

  setDocumentVersionPreservation(
    payload: AdminCoworkerDocumentPreservationPayload,
  ): Observable<ICoworkerDocumentVersionPreservationResult> {
    const request = {
      action: ADMIN_COWORKER_DOCUMENT_ACTION.setDocumentVersionPreservation,
      ...payload,
    } satisfies AdminCoworkerDocumentActionRequest;
    return this.invoke(
      request,
      createDocumentVersionPreservationReader(
        payload.documentId,
        payload.documentVersionId,
        payload.preservationKind,
      ),
    );
  }

  private invoke<TResult>(
    request: AdminCoworkerDocumentActionRequest,
    reader: (value: unknown, path: string) => TResult,
  ): Observable<TResult> {
    return this.backend.invokeEdgeParsed(
      COWORKER_EDGE_FUNCTION.adminDocuments,
      { method: 'POST', body: request },
      reader,
    );
  }
}
