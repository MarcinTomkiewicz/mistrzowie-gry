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
  readEdgeNullableString,
  readEdgeObject,
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
  venueAttendance: createStrictEdgeObjectReader({
    capacity: createEdgeNullableReader(readEdgeNonNegativeInteger),
    remaining: createEdgeNullableReader(readEdgeNonNegativeInteger),
    activeIdentities: readEdgeNonNegativeInteger,
    atCapacityForNewIdentity: readEdgeBoolean,
  }),
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
        items.every((item) => !item.canSignup ||
          (item.availabilityStatus === 'available' && (item.isUnlimited || (item.remainingSeats !== null && item.remainingSeats > 0)))),
        'participantAvailability', 'available status and unlimited or positive remaining seats when signup is allowed',
      );
      return items.map((item): IEventParticipantAvailability => {
        if (item.scope === 'whole_event') {
          assertEdgeContract(item.programItemId === null, 'participantAvailability.programItemId', 'null for whole_event scope');
          return { ...item, scope: 'whole_event', programItemId: null };
        }
        assertEdgeContract(
          item.programItemId !== null,
          'participantAvailability.programItemId', 'a UUID for program_item scope',
        );
        return { ...item, scope: 'program_item', programItemId: item.programItemId };
      });
    }));
  }

  register(
    request: IEventParticipantRegisterRequest,
  ): Observable<IEventParticipantRegisterResult> {
    return this.backend.rpc<unknown>(
      request.scope === 'program_item' ? EVENT_RPC.registerParticipant : EVENT_RPC.registerWholeEventParticipant,
      {
        ...(request.scope === 'program_item' ? { p_program_item_id: request.programItemId } : { p_occurrence_id: request.occurrenceId }),
        p_guest_name: request.mode === 'guest' ? request.guestName : null,
        p_guest_phone: request.mode === 'guest' ? request.guestPhone : null,
      },
    ).pipe(map(response => this.readRegistration(response)));
  }

  private readRegistration(response: unknown): IEventParticipantRegisterResult {
    const object = readEdgeObject(response, 'participantRegistration');
    if (object['registered'] === false) {
      const result = createStrictEdgeObjectReader({ registered: readEdgeBoolean,
        status: createEdgeLiteralReader(['unavailable']),
      })(response, 'participantRegistration');
      assertEdgeContract(result.registered === false, 'participantRegistration.registered', 'false');
      return { ...result, registered: false };
    }
    const result = createStrictEdgeObjectReader({
      registered: readEdgeBoolean, status: createEdgeLiteralReader(['confirmed']),
      registrationId: readEdgeUuid, occurrenceId: readEdgeUuid,
      eventProgramItemId: createEdgeNullableReader(readEdgeUuid),
      scope: createEdgeLiteralReader(['program_item', 'whole_event']), confirmationCode: readEdgeNullableString,
    })(response, 'participantRegistration');
    assertEdgeContract(result.registered === true, 'participantRegistration.registered', 'true');
    if (result.scope === 'program_item') {
      assertEdgeContract(result.eventProgramItemId !== null, 'participantRegistration.eventProgramItemId', 'a session UUID');
      return { ...result, registered: true, scope: 'program_item', eventProgramItemId: result.eventProgramItemId };
    }
    assertEdgeContract(result.eventProgramItemId === null, 'participantRegistration.eventProgramItemId', 'null for whole_event');
    return { ...result, registered: true, scope: 'whole_event', eventProgramItemId: null };
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
