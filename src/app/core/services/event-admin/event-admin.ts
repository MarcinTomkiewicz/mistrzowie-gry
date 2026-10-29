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
import type { AdminEventTimeline } from '../../interfaces/i-admin-event-timeline';
import type { AdminGlobalEventPagePreview } from '../../interfaces/i-admin-global-event-preview';
import type {
  AddAdminGlobalEventCityPayload,
  AddAdminGlobalEventCityResult,
  AdminDatedTimeBlocksPreview,
  AdminDatedTimeBlocksSave,
  AdminEffectivePolicyResult,
  AdminGlobalCalendarResult,
  AdminGlobalCalendarPreview,
  AdminGlobalCalendarSave,
  AdminGlobalCalendarApply,
  EventGlobalCalendarChange,
  CreateAdminGlobalEventPayload,
  CreateAdminGlobalEventResult,
  EventDatedTimeBlocksCommand,
  SaveAdminGlobalEventEditionMetadataPayload,
  SaveAdminGlobalEventEditionMetadataResult,
} from '../../interfaces/i-admin-global-event';
import {
  AdminEventProgramParticipants,
  AdminParticipantSignupState,
  EventEditionSaveResult,
  EventPublishResult,
  EventProgramReconciliationResult,
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

  createGlobalEvent(requestId: string, payload: CreateAdminGlobalEventPayload): Observable<CreateAdminGlobalEventResult> {
    return this.backend.rpc<CreateAdminGlobalEventResult>(EVENT_RPC.createGlobalEvent, {
      p_request_id: requestId,
      p_payload: payload,
    });
  }

  getGlobalCalendar(coreId: string): Observable<AdminGlobalCalendarResult> {
    return this.backend.rpc<AdminGlobalCalendarResult>(EVENT_RPC.getGlobalCalendar, { p_core_id: coreId });
  }

  previewGlobalCalendar(change: EventGlobalCalendarChange): Observable<AdminGlobalCalendarPreview> {
    return this.backend.rpc<AdminGlobalCalendarPreview>(EVENT_RPC.previewGlobalCalendar, {
      p_core_id: change.coreId, p_schedule: change.schedule,
      p_time_blocks: change.timeBlocks, p_city_exclusions: change.cityExclusions,
    });
  }

  saveGlobalCalendarDraft(change: EventGlobalCalendarChange, draftRevision: number): Observable<AdminGlobalCalendarSave> {
    return this.backend.rpc<AdminGlobalCalendarSave>(EVENT_RPC.saveGlobalCalendarDraft, {
      p_core_id: change.coreId, p_expected_revision: draftRevision, p_schedule: change.schedule,
      p_time_blocks: change.timeBlocks, p_city_exclusions: change.cityExclusions,
    });
  }

  applyGlobalCalendarDraft(coreId: string, calendarRevision: number, draftRevision: number): Observable<AdminGlobalCalendarApply> {
    return this.backend.rpc<AdminGlobalCalendarApply>(EVENT_RPC.applyGlobalCalendarDraft, {
      p_core_id: coreId, p_expected_calendar_revision: calendarRevision, p_expected_draft_revision: draftRevision,
    });
  }

  previewGlobalEventPage(coreId: string): Observable<AdminGlobalEventPagePreview> {
    return this.backend.rpc<AdminGlobalEventPagePreview>(EVENT_RPC.previewGlobalEventPage, {
      p_payload: { coreId },
    });
  }

  addGlobalEventCity(coreId: string, requestId: string, payload: AddAdminGlobalEventCityPayload): Observable<AddAdminGlobalEventCityResult> {
    return this.backend.rpc<AddAdminGlobalEventCityResult>(EVENT_RPC.addGlobalEventCity, {
      p_core_id: coreId,
      p_request_id: requestId,
      p_payload: payload,
    });
  }

  previewDatedTimeBlocks(command: EventDatedTimeBlocksCommand): Observable<AdminDatedTimeBlocksPreview> {
    return this.backend.rpc<AdminDatedTimeBlocksPreview>(EVENT_RPC.previewDatedTimeBlocks, {
      p_core_id: command.coreId,
      p_expected_calendar_revision: command.expectedCalendarRevision,
      p_date_time_blocks: command.dateTimeBlocks,
      p_city_date_time_blocks: command.cityDateTimeBlocks,
    });
  }

  saveDatedTimeBlocks(command: EventDatedTimeBlocksCommand): Observable<AdminDatedTimeBlocksSave> {
    return this.backend.rpc<AdminDatedTimeBlocksSave>(EVENT_RPC.saveDatedTimeBlocks, {
      p_core_id: command.coreId,
      p_expected_calendar_revision: command.expectedCalendarRevision,
      p_date_time_blocks: command.dateTimeBlocks,
      p_city_date_time_blocks: command.cityDateTimeBlocks,
    });
  }

  getEffectivePolicy(coreId: string): Observable<AdminEffectivePolicyResult> {
    return this.backend.rpc<AdminEffectivePolicyResult>(EVENT_RPC.getEffectivePolicy, { p_core_id: coreId });
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

  saveGlobalEditionMetadata(payload: SaveAdminGlobalEventEditionMetadataPayload): Observable<SaveAdminGlobalEventEditionMetadataResult> {
    return this.backend.rpc<SaveAdminGlobalEventEditionMetadataResult>(EVENT_RPC.saveGlobalEditionMetadata, { p_payload: payload });
  }

  getTimeline(editionId: string): Observable<AdminEventTimeline> {
    return this.backend.rpc<AdminEventTimeline>(EVENT_RPC.getTimeline, { p_event_id: editionId });
  }

  getProgramParticipants(programItemId: string): Observable<AdminEventProgramParticipants> {
    return this.backend.rpc<AdminEventProgramParticipants>(EVENT_RPC.getProgramParticipants, {
      p_program_item_id: programItemId,
    });
  }

  publishStaffingEvent(eventId: string): Observable<EventPublishResult> {
    return this.backend.rpc<EventPublishResult>(EVENT_RPC.publishStaffingEvent, {
      p_event_id: eventId,
    });
  }

  reconcileStaffingEventProgram(eventId: string): Observable<EventProgramReconciliationResult> {
    return this.backend.rpc<EventProgramReconciliationResult>(EVENT_RPC.reconcileStaffingEventProgram, {
      p_event_id: eventId,
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

  setParticipantSignupState(occurrenceId: string, open: boolean): Observable<AdminParticipantSignupState> {
    return this.backend.rpc<AdminParticipantSignupState>(EVENT_RPC.setParticipantSignupState, {
      p_occurrence_id: occurrenceId,
      p_open: open,
    });
  }
}
