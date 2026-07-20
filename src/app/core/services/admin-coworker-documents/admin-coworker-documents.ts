import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { COWORKER_EDGE_FUNCTION } from '../../configs/coworker-edge-functions.config';
import {
  IAdminCoworkerDocumentsDashboard,
  IAdminCoworkerOnboardingResult,
  IAdminCoworkerSeedResult,
} from '../../interfaces/i-admin-coworker-document';
import {
  ADMIN_COWORKER_DOCUMENT_ACTION,
  AdminCoworkerDocumentActionRequest,
  AdminCoworkerDocumentDefinitionPayload,
  AdminCoworkerRequirementPayload,
} from '../../types/admin-coworker-document';
import { EdgeReader } from '../../types/edge-contract';
import { createEdgeSuccessReader } from '../../utils/edge-contract';
import { Backend } from '../backend/backend';
import {
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
