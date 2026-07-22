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
  AdminCoworkerAcceptDocumentPayload,
  type AdminCoworkerDocumentActionRequest,
  AdminCoworkerDocumentDefinitionPayload,
  AdminCoworkerDocumentDownloadPayload,
  AdminCoworkerRejectDocumentPayload,
  AdminCoworkerRequirementPayload,
  AdminSignatureVerificationPayload,
} from '../../types/admin-coworker-document';
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
    return this.backend.invokeEdgeParsed(
      COWORKER_EDGE_FUNCTION.adminDocuments,
      {
        method: 'POST',
        body: { action: ADMIN_COWORKER_DOCUMENT_ACTION.saveDefinition, definition } satisfies AdminCoworkerDocumentActionRequest,
      },
      createEdgeSuccessReader(
        ADMIN_COWORKER_DOCUMENT_ACTION.saveDefinition,
      ),
    );
  }

  ensureOnboarding(userId: string): Observable<IAdminCoworkerOnboardingResult> {
    return this.backend.invokeEdgeParsed(
      COWORKER_EDGE_FUNCTION.adminDocuments,
      {
        method: 'POST',
        body: { action: ADMIN_COWORKER_DOCUMENT_ACTION.ensureOnboarding, userId } satisfies AdminCoworkerDocumentActionRequest,
      },
      ensureOnboardingReader,
    );
  }

  seedDefaultRequirements(
    userId: string,
    onboardingCaseId: string,
  ): Observable<IAdminCoworkerSeedResult> {
    return this.backend.invokeEdgeParsed(
      COWORKER_EDGE_FUNCTION.adminDocuments,
      {
        method: 'POST',
        body: {
          action: ADMIN_COWORKER_DOCUMENT_ACTION.seedDefaultRequirements,
          userId,
          onboardingCaseId,
        } satisfies AdminCoworkerDocumentActionRequest,
      },
      seedDefaultRequirementsReader,
    );
  }

  assignRequirement(
    requirement: AdminCoworkerRequirementPayload,
  ): Observable<void> {
    return this.backend.invokeEdgeParsed(
      COWORKER_EDGE_FUNCTION.adminDocuments,
      {
        method: 'POST',
        body: { action: ADMIN_COWORKER_DOCUMENT_ACTION.assignRequirement, requirement } satisfies AdminCoworkerDocumentActionRequest,
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
    return this.backend.invokeEdgeParsed(
      COWORKER_EDGE_FUNCTION.adminDocuments,
      {
        method: 'POST',
        body: {
          action: ADMIN_COWORKER_DOCUMENT_ACTION.getReviewDetail,
          userId,
          documentId,
        } satisfies AdminCoworkerDocumentActionRequest,
      },
      adminCoworkerReviewDetailReader,
    );
  }

  startReview(userId: string, documentId: string): Observable<void> {
    return this.backend.invokeEdgeParsed(
      COWORKER_EDGE_FUNCTION.adminDocuments,
      {
        method: 'POST',
        body: { action: ADMIN_COWORKER_DOCUMENT_ACTION.startReview, userId, documentId } satisfies AdminCoworkerDocumentActionRequest,
      },
      createEdgeSuccessReader(ADMIN_COWORKER_DOCUMENT_ACTION.startReview),
    );
  }

  verifySignature(
    payload: AdminSignatureVerificationPayload,
  ): Observable<void> {
    return this.backend.invokeEdgeParsed(
      COWORKER_EDGE_FUNCTION.adminDocuments,
      {
        method: 'POST',
        body: { action: ADMIN_COWORKER_DOCUMENT_ACTION.verifySignature, ...payload } satisfies AdminCoworkerDocumentActionRequest,
      },
      createEdgeSuccessReader(ADMIN_COWORKER_DOCUMENT_ACTION.verifySignature),
    );
  }

  acceptDocument(payload: AdminCoworkerAcceptDocumentPayload): Observable<void> {
    return this.backend.invokeEdgeParsed(
      COWORKER_EDGE_FUNCTION.adminDocuments,
      {
        method: 'POST',
        body: { action: ADMIN_COWORKER_DOCUMENT_ACTION.acceptDocument, ...payload } satisfies AdminCoworkerDocumentActionRequest,
      },
      createEdgeSuccessReader(ADMIN_COWORKER_DOCUMENT_ACTION.acceptDocument),
    );
  }

  rejectDocument(payload: AdminCoworkerRejectDocumentPayload): Observable<void> {
    return this.backend.invokeEdgeParsed(
      COWORKER_EDGE_FUNCTION.adminDocuments,
      {
        method: 'POST',
        body: { action: ADMIN_COWORKER_DOCUMENT_ACTION.rejectDocument, ...payload } satisfies AdminCoworkerDocumentActionRequest,
      },
      createEdgeSuccessReader(ADMIN_COWORKER_DOCUMENT_ACTION.rejectDocument),
    );
  }

  downloadDocumentVersion(
    payload: AdminCoworkerDocumentDownloadPayload,
  ): Observable<IAdminCoworkerVersionDownload> {
    return this.backend.invokeEdgeParsed(
      COWORKER_EDGE_FUNCTION.adminDocuments,
      {
        method: 'POST',
        body: {
          action: ADMIN_COWORKER_DOCUMENT_ACTION.downloadDocumentVersion,
          ...payload,
        } satisfies AdminCoworkerDocumentActionRequest,
      },
      adminCoworkerDocumentDownloadReader,
    );
  }
}
