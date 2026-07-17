import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import {
  ICoworkerQuestionnaireGetResponse,
  ICoworkerQuestionnaireSaveRequest,
  ICoworkerQuestionnaireSaveResponse,
} from '../../interfaces/i-coworker-questionnaire';
import { COWORKER_EDGE_FUNCTION } from '../../configs/coworker-edge-functions.config';
import { Backend } from '../backend/backend';
import {
  parseCoworkerQuestionnaireGetResponse,
  parseCoworkerQuestionnaireSaveResponse,
} from './coworker-questionnaire.contract';

@Injectable({ providedIn: 'root' })
export class CoworkerQuestionnaire {
  private readonly backend = inject(Backend);

  get(): Observable<ICoworkerQuestionnaireGetResponse> {
    return this.backend
      .invokeEdge<unknown>(COWORKER_EDGE_FUNCTION.questionnaire, {
        method: 'GET',
      })
      .pipe(map(parseCoworkerQuestionnaireGetResponse));
  }

  save(
    request: ICoworkerQuestionnaireSaveRequest,
  ): Observable<ICoworkerQuestionnaireSaveResponse> {
    return this.backend
      .invokeEdge<unknown, ICoworkerQuestionnaireSaveRequest>(
        COWORKER_EDGE_FUNCTION.questionnaire,
        { method: 'PUT', body: request },
      )
      .pipe(map(parseCoworkerQuestionnaireSaveResponse));
  }
}
