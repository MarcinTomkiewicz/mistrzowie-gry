import { inject, Injectable } from '@angular/core';
import {
  catchError,
  defer,
  map,
  Observable,
  of,
  switchMap,
  throwError,
} from 'rxjs';

import { EVENT_RPC } from '../../configs/event-rpc.config';
import {
  EventEditionSaveResult,
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
import { ImageStorage } from '../image-storage/image-storage';
import { Storage } from '../storage/storage';

@Injectable({ providedIn: 'root' })
export class EventAdmin {
  private readonly backend = inject(Backend);
  private readonly imageStorage = inject(ImageStorage);
  private readonly storage = inject(Storage);

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

  saveEditionWithCover(
    payload: IEventSavePayload,
    file: File | null,
    previousCoverPath: string | null,
  ): Observable<EventEditionSaveResult> {
    return defer(() => {
      const coverPath$ = file
        ? payload.id
          ? this.imageStorage.transcodeAndUpload(file, {
              bucket: 'images',
              folder: `content/events/${payload.id}`,
              usePublicUrl: false,
            })
          : throwError(() => new Error(
              'Save the Event edition before uploading its cover.',
            ))
        : of(payload.coverImagePath);

      return coverPath$.pipe(
        switchMap((coverImagePath) =>
          this.saveEdition({ ...payload, coverImagePath }).pipe(
            map((edition): EventEditionSaveResult => ({
              status: 'saved',
              edition,
              coverCleanupFailed: false,
            })),
            catchError((error: unknown) =>
              of<EventEditionSaveResult>({
                status: 'failed',
                phase: 'save',
                error,
                coverCleanupFailed: false,
              }),
            ),
            switchMap((result) => {
              const cleanupPath = result.status === 'saved'
                ? previousCoverPath !== result.edition.coverImagePath
                  ? previousCoverPath
                  : null
                : file ? coverImagePath : null;

              return this.storage.removeFile(cleanupPath, 'images').pipe(
                map(() => result),
                catchError(() => of({ ...result, coverCleanupFailed: true })),
              );
            }),
          ),
        ),
      );
    }).pipe(
      catchError((error: unknown) =>
        of<EventEditionSaveResult>({
          status: 'failed',
          phase: 'upload',
          error,
          coverCleanupFailed: false,
        }),
      ),
    );
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
