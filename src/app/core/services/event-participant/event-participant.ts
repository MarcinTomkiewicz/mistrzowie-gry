import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { EVENT_RPC } from '../../configs/event-rpc.config';
import type {
  IEventParticipantAvailability,
  IEventParticipantCancelMyResult,
  IEventParticipantGetMyResult,
  IEventParticipantOwnRequest,
  IEventParticipantRegisterRequest,
  IEventParticipantRegisterResult,
} from '../../interfaces/i-event-participant';
import {
  assertEdgeContract, createEdgeArrayReader, createEdgeNullableReader, readEdgeBoolean,
  readEdgeNonNegativeInteger, readEdgeUuid,
} from '../../utils/edge-contract';
import { createStrictEdgeObjectReader } from '../../utils/strict-edge-contract';
import { Backend } from '../backend/backend';

const readAvailability = createEdgeArrayReader(createStrictEdgeObjectReader({
  programItemId: readEdgeUuid,
  occurrenceId: readEdgeUuid,
  canSignup: readEdgeBoolean,
  remainingSeats: createEdgeNullableReader(readEdgeNonNegativeInteger),
}));

@Injectable({ providedIn: 'root' })
export class EventParticipant {
  private readonly backend = inject(Backend);

  getPublicAvailability(eventId: string): Observable<IEventParticipantAvailability[]> {
    return this.backend.rpc<unknown>(EVENT_RPC.getPublicParticipantAvailability, {
      p_event_id: eventId,
    }).pipe(map((response) => {
      const items = readAvailability(response, 'participantAvailability');
      assertEdgeContract(
        items.every((item) => !item.canSignup || (item.remainingSeats !== null && item.remainingSeats > 0)),
        'participantAvailability', 'positive remaining seats when signup is allowed',
      );
      return items;
    }));
  }

  register(
    request: IEventParticipantRegisterRequest,
  ): Observable<IEventParticipantRegisterResult> {
    return this.backend.rpc<IEventParticipantRegisterResult>(
      EVENT_RPC.registerParticipant,
      {
        p_program_item_id: request.programItemId,
        p_guest_name: request.mode === 'guest' ? request.guestName : null,
        p_guest_phone: request.mode === 'guest' ? request.guestPhone : null,
      },
    );
  }

  getMy(
    request: IEventParticipantOwnRequest,
  ): Observable<IEventParticipantGetMyResult> {
    return this.backend.rpc<IEventParticipantGetMyResult>(
      EVENT_RPC.getMyParticipant,
      {
        p_registration_id: request.registrationId,
        p_confirmation_code: request.confirmationCode,
      },
    );
  }

  cancelMy(
    request: IEventParticipantOwnRequest,
  ): Observable<IEventParticipantCancelMyResult> {
    return this.backend.rpc<IEventParticipantCancelMyResult>(
      EVENT_RPC.cancelMyParticipant,
      {
        p_registration_id: request.registrationId,
        p_confirmation_code: request.confirmationCode,
      },
    );
  }
}
