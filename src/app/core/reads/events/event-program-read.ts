import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { EVENT_RPC } from '../../configs/event-rpc.config';
import { FilterOperator } from '../../enums/filter-operators';
import { Backend } from '../../services/backend/backend';
import { ACTIVE_HOST_SIGNUP_STATUSES } from '../../types/event-signup';
import type { PublicEventProgramData, PublicEventProgramWireEntry } from '../../types/public-event-program';
import { assertEdgeContract } from '../../utils/edge-contract';
import { decodePublicEventProgram } from './public-event-program.contract';

@Injectable({ providedIn: 'root' })
export class EventProgramRead {
  private readonly backend = inject(Backend);

  getPublicProgram(eventId: string, occurrenceId: string | null = null): Observable<PublicEventProgramData> {
    return this.backend.rpc<PublicEventProgramWireEntry[]>(EVENT_RPC.getPublicProgram, {
      p_event_id: eventId, p_occurrence_id: occurrenceId,
    }).pipe(
      map(decodePublicEventProgram),
      map(entries => {
        assertEdgeContract(occurrenceId === null || entries.every(entry => entry.occurrenceId === occurrenceId),
          'publicEventProgram.occurrenceId', 'only the requested Occurrence');
        return { entries };
      }),
    );
  }

  getActiveHostSignupCountByOccurrenceId(occurrenceId: string): Observable<number> {
    return this.backend.getCount('event_program_items', {
      occurrenceId: { operator: FilterOperator.EQ, value: occurrenceId },
      status: { operator: FilterOperator.IN, value: [...ACTIVE_HOST_SIGNUP_STATUSES] },
    });
  }
}
