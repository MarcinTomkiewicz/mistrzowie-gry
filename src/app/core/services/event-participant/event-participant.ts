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
  assertEdgeContract,
  createEdgeArrayReader,
  createEdgeLiteralReader,
  createEdgeNullableReader,
  readEdgeBoolean,
  readEdgeNonNegativeInteger,
  readEdgeUuid,
} from '../../utils/edge-contract';
import { createStrictEdgeObjectReader } from '../../utils/strict-edge-contract';
import { Backend } from '../backend/backend';

const readAvailability = createEdgeArrayReader(createStrictEdgeObjectReader({
  scope: createEdgeLiteralReader(['program_item', 'whole_event']),
  occurrenceId: readEdgeUuid,
  programItemId: createEdgeNullableReader(readEdgeUuid),
  availabilityStatus: createEdgeLiteralReader([
    'available', 'full', 'not_open', 'scheduled', 'closed', 'past', 'unavailable', 'release_disabled',
  ]),
  canSignup: readEdgeBoolean,
  capacity: createEdgeNullableReader(readEdgeNonNegativeInteger),
  isUnlimited: readEdgeBoolean,
  remainingSeats: createEdgeNullableReader(readEdgeNonNegativeInteger),
}));

@Injectable({ providedIn: 'root' })
export class EventParticipant {
  private readonly backend = inject(Backend);

  getPublicAvailability(eventId: string): Observable<IEventParticipantAvailability[]> {
    return this.backend.rpc<unknown>(EVENT_RPC.getPublicParticipantAvailability, {
      p_event_id: eventId,
    }).pipe(map((response) => {
      const items = readAvailability(response, 'participantAvailability')
        .filter((item) => item.scope === 'program_item');
      assertEdgeContract(
        items.every((item) => !item.canSignup ||
          (item.availabilityStatus === 'available' && item.remainingSeats !== null && item.remainingSeats > 0)),
        'participantAvailability', 'available status and positive remaining seats when signup is allowed',
      );
      return items.map((item) => {
        assertEdgeContract(
          item.programItemId !== null,
          'participantAvailability.programItemId', 'a UUID for program_item scope',
        );
        return {
          programItemId: item.programItemId,
          occurrenceId: item.occurrenceId,
          canSignup: item.canSignup,
          remainingSeats: item.remainingSeats,
        };
      });
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
