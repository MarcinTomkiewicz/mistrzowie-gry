import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { FilterOperator } from '../../enums/filter-operators';
import { ICoworkerProfile } from '../../interfaces/i-coworker-profile';
import { Backend } from '../backend/backend';

@Injectable({ providedIn: 'root' })
export class CoworkerProfile {
  private readonly backend = inject(Backend);

  getProfilesByUserIds(userIds: readonly string[]): Observable<ICoworkerProfile[]> {
    if (!userIds.length) {
      return of([]);
    }

    return this.backend.getAll<ICoworkerProfile>({
      table: 'coworker_profiles',
      sortBy: 'firstName',
      sortOrder: 'asc',
      pagination: {
        filters: {
          userId: {
            operator: FilterOperator.IN,
            value: [...userIds],
          },
        },
      },
    });
  }
}
