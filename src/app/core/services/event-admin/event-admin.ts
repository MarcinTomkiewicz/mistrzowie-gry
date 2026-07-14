import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { EVENT_RPC } from '../../configs/event-rpc.config';
import {
  IAdminEventDetail,
  IAdminEventListItem,
  IAdminOccurrence,
  IEventCoreDetail,
  IEventCoreListItem,
  IEventCoreSavePayload,
  IEventSavePayload,
  IOccurrenceSavePayload,
} from '../../interfaces/i-event-admin';
import { Backend } from '../backend/backend';

@Injectable({ providedIn: 'root' })
export class EventAdmin {
  private readonly backend = inject(Backend);

  getCoreList(): Observable<IEventCoreListItem[]> {
    return this.backend.rpc<IEventCoreListItem[]>(EVENT_RPC.getCoreList);
  }

  getCoreDetail(coreId: string): Observable<IEventCoreDetail | null> {
    return this.backend.rpc<IEventCoreDetail | null>(
      EVENT_RPC.getCoreDetail,
      { p_event_core_id: coreId },
    );
  }

  saveCore(payload: IEventCoreSavePayload): Observable<IEventCoreDetail> {
    return this.backend.rpc<IEventCoreDetail>(EVENT_RPC.saveCore, {
      p_payload: payload,
    });
  }

  setCoreActive(
    coreId: string,
    isActive: boolean,
  ): Observable<IEventCoreDetail> {
    return this.backend.rpc<IEventCoreDetail>(EVENT_RPC.setCoreActive, {
      p_event_core_id: coreId,
      p_is_active: isActive,
    });
  }

  getEditionList(): Observable<IAdminEventListItem[]> {
    return this.backend.rpc<IAdminEventListItem[]>(EVENT_RPC.getEditionList);
  }

  getEditionDetail(eventId: string): Observable<IAdminEventDetail | null> {
    return this.backend.rpc<IAdminEventDetail | null>(
      EVENT_RPC.getEditionDetail,
      { p_event_id: eventId },
    );
  }

  saveEdition(payload: IEventSavePayload): Observable<IAdminEventDetail> {
    return this.backend.rpc<IAdminEventDetail>(EVENT_RPC.saveEdition, {
      p_payload: payload,
    });
  }

  setEditionActive(
    eventId: string,
    isActive: boolean,
  ): Observable<IAdminEventDetail> {
    return this.backend.rpc<IAdminEventDetail>(EVENT_RPC.setEditionActive, {
      p_event_id: eventId,
      p_is_active: isActive,
    });
  }

  saveOccurrence(
    payload: IOccurrenceSavePayload,
  ): Observable<IAdminOccurrence> {
    return this.backend.rpc<IAdminOccurrence>(EVENT_RPC.saveOccurrence, {
      p_payload: payload,
    });
  }
}
