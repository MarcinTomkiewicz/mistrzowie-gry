import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { COWORKER_EDGE_FUNCTION } from '../../configs/coworker-edge-functions.config';
import {
  IAdminCoworkerDocumentsDashboard,
  IAdminCoworkerDocumentReviewDetail,
  IAdminCoworkerOnboardingResult,
  IAdminCoworkerSeedResult,
  IAdminCoworkerVersionDownload,
} from '../../interfaces/i-admin-coworker-document';
import {
  ADMIN_COWORKER_DOCUMENT_ACTION,
  AdminCoworkerDocumentActionRequest,
  AdminCoworkerAcceptDocumentPayload,
  AdminCoworkerDocumentDefinitionPayload,
  AdminCoworkerDocumentDownloadPayload,
  AdminCoworkerRejectDocumentPayload,
  AdminCoworkerRequirementPayload,
  AdminSignatureVerificationPayload,
} from '../../types/admin-coworker-document';
import { EdgeReader } from '../../types/edge-contract';
import { createEdgeSuccessReader } from '../../utils/edge-contract';
import { Backend } from '../backend/backend';
import {
  adminCoworkerDocumentDownloadReader,
  adminCoworkerReviewDetailReader,
  ensureOnboardingReader,
  parseAdminCoworkerDocumentsDashboard,
  seedDefaultRequirementsReader,
} from './admin-coworker-documents.contract';

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
  ): Observable<void> {
    return this.invokeAction(
      {
        action: ADMIN_COWORKER_DOCUMENT_ACTION.saveDefinition,
        definition,
      },
      createEdgeSuccessReader(
        ADMIN_COWORKER_DOCUMENT_ACTION.saveDefinition,
      ),
    );
  }

  ensureOnboarding(userId: string): Observable<IAdminCoworkerOnboardingResult> {
    return this.invokeAction(
      {
        action: ADMIN_COWORKER_DOCUMENT_ACTION.ensureOnboarding,
        userId,
      },
      ensureOnboardingReader,
    );
  }

  seedDefaultRequirements(
    userId: string,
    onboardingCaseId: string,
  ): Observable<IAdminCoworkerSeedResult> {
    return this.invokeAction(
      {
        action: ADMIN_COWORKER_DOCUMENT_ACTION.seedDefaultRequirements,
        userId,
        onboardingCaseId,
      },
      seedDefaultRequirementsReader,
    );
  }

  assignRequirement(
    requirement: AdminCoworkerRequirementPayload,
  ): Observable<void> {
    return this.invokeAction(
      {
        action: ADMIN_COWORKER_DOCUMENT_ACTION.assignRequirement,
        requirement,
      },
      createEdgeSuccessReader(
        ADMIN_COWORKER_DOCUMENT_ACTION.assignRequirement,
      ),
    );
  }

  getReviewDetail(
    userId: string,
    documentId: string,
  ): Observable<IAdminCoworkerDocumentReviewDetail> {
    return this.invokeAction(
      {
        action: ADMIN_COWORKER_DOCUMENT_ACTION.getReviewDetail,
        userId,
        documentId,
      },
      adminCoworkerReviewDetailReader,
    );
  }

  startReview(userId: string, documentId: string): Observable<void> {
    return this.invokeAction(
      {
        action: ADMIN_COWORKER_DOCUMENT_ACTION.startReview,
        userId,
        documentId,
      },
      createEdgeSuccessReader(ADMIN_COWORKER_DOCUMENT_ACTION.startReview),
    );
  }

  verifySignature(
    payload: AdminSignatureVerificationPayload,
  ): Observable<void> {
    return this.invokeAction(
      {
        action: ADMIN_COWORKER_DOCUMENT_ACTION.verifySignature,
        ...payload,
      },
      createEdgeSuccessReader(ADMIN_COWORKER_DOCUMENT_ACTION.verifySignature),
    );
  }

  acceptDocument(payload: AdminCoworkerAcceptDocumentPayload): Observable<void> {
    return this.invokeAction(
      {
        action: ADMIN_COWORKER_DOCUMENT_ACTION.acceptDocument,
        ...payload,
      },
      createEdgeSuccessReader(ADMIN_COWORKER_DOCUMENT_ACTION.acceptDocument),
    );
  }

  rejectDocument(payload: AdminCoworkerRejectDocumentPayload): Observable<void> {
    return this.invokeAction(
      {
        action: ADMIN_COWORKER_DOCUMENT_ACTION.rejectDocument,
        ...payload,
      },
      createEdgeSuccessReader(ADMIN_COWORKER_DOCUMENT_ACTION.rejectDocument),
    );
  }

  downloadDocumentVersion(
    payload: AdminCoworkerDocumentDownloadPayload,
  ): Observable<IAdminCoworkerVersionDownload> {
    return this.invokeAction(
      {
        action: ADMIN_COWORKER_DOCUMENT_ACTION.downloadDocumentVersion,
        ...payload,
      },
      adminCoworkerDocumentDownloadReader,
    );
  }

  private invokeAction<TResponse>(
    request: AdminCoworkerDocumentActionRequest,
    reader: EdgeReader<TResponse>,
  ): Observable<TResponse> {
    return this.backend
      .invokeEdge<unknown, AdminCoworkerDocumentActionRequest>(
        COWORKER_EDGE_FUNCTION.adminDocuments,
        { method: 'POST', body: request },
      )
      .pipe(map((response) => reader(response, 'response')));
  }
}
