import { inject, Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';

import { COWORKER_EDGE_FUNCTION } from '../../configs/coworker-edge-functions.config';
import { IPayrollIdentity } from '../../interfaces/i-payroll-identity';
import {
  assertEdgeContract,
  readEdgeLiteral,
  readEdgeNonBlankString,
  readEdgeObject,
  readEdgeUuid,
} from '../../utils/edge-contract';
import { Backend } from '../backend/backend';

@Injectable({ providedIn: 'root' })
export class PayrollIdentity {
  private readonly backend = inject(Backend);

  getByUserIds(
    userIds: readonly string[],
  ): Observable<IPayrollIdentity[]> {
    if (!userIds.length) {
      return of([]);
    }

    return forkJoin(
      userIds.map((userId) =>
        this.getByUserId(userId).pipe(catchError(() => of(null))),
      ),
    ).pipe(
      map((identities) => identities.filter((identity) => identity !== null)),
    );
  }

  private getByUserId(userId: string): Observable<IPayrollIdentity | null> {
    return this.backend.invokeEdgeParsed(
      COWORKER_EDGE_FUNCTION.adminQuestionnaire,
      {
        method: 'POST',
        body: {
          action: 'getQuestionnaire',
          userId,
          scope: 'masked',
          purpose: 'payroll_processing',
        },
      },
      (value, path) => readPayrollIdentity(value, path, userId),
    );
  }
}

function readPayrollIdentity(
  value: unknown,
  path: string,
  expectedUserId: string,
): IPayrollIdentity | null {
  const response = readEdgeObject(value, path);
  readEdgeLiteral(response['ok'], `${path}.ok`, [true] as const);
  readEdgeLiteral(response['action'], `${path}.action`, [
    'getQuestionnaire',
  ] as const);
  readEdgeLiteral(response['scope'], `${path}.scope`, ['masked'] as const);
  readEdgeLiteral(response['purpose'], `${path}.purpose`, [
    'payroll_processing',
  ] as const);

  const questionnaire = readEdgeObject(
    response['questionnaire'],
    `${path}.questionnaire`,
  );
  const userId = readEdgeUuid(
    questionnaire['userId'],
    `${path}.questionnaire.userId`,
  );
  assertEdgeContract(
    userId === expectedUserId,
    `${path}.questionnaire.userId`,
    expectedUserId,
  );

  if (questionnaire['data'] === null) {
    return null;
  }

  const dataPath = `${path}.questionnaire.data`;
  const data = readEdgeObject(questionnaire['data'], dataPath);
  const personalPath = `${dataPath}.personal`;
  const personal = readEdgeObject(data['personal'], personalPath);
  const firstName = readEdgeNonBlankString(
    personal['firstName'],
    `${personalPath}.firstName`,
  );
  const lastName = readEdgeNonBlankString(
    personal['lastName'],
    `${personalPath}.lastName`,
  );

  return {
    userId,
    firstName,
    lastName,
  };
}
