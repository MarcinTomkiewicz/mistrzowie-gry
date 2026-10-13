import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { EVENT_RPC } from '../../configs/event-rpc.config';
import type {
  IEventParticipantCancelMyResult,
  IEventParticipantGetMyResult,
  IEventParticipantOwnRequest,
  IEventParticipantRegisterRequest,
  IEventParticipantRegisterResult,
} from '../../interfaces/i-event-participant';
import { Backend } from '../backend/backend';

@Injectable({ providedIn: 'root' })
export class EventParticipant {
  private readonly backend = inject(Backend);

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
