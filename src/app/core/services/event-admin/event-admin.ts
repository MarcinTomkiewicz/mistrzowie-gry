import { inject, Injectable } from '@angular/core';
import { defer, map, Observable, tap } from 'rxjs';

import { EVENT_RPC } from '../../configs/event-rpc.config';
import { EventOccurrenceStatus, ParticipantSignupKind } from '../../enums/event';
import type { AdminEventTimeline } from '../../interfaces/i-admin-event-timeline';
import type { ManualRpgSlotPayload, ManualRpgSlotResult, ManualRpgPublicationResult } from '../../interfaces/i-event-program-item';
import type { AdminEventActivityKinds, ManualActivityPayload, ManualActivityResult, ManualActivityPublicationResult } from '../../interfaces/i-admin-event-activity';
import { readManualActivityPublication, readManualRpgPublication } from '../../reads/events/admin-global-publication.contract';
import { assertAdminEventTimeline } from '../../reads/events/admin-event-timeline.contract';
import { readAdminEventCoreDetail, readAdminEventCoreList } from '../../reads/events/admin-event-core.contract';
import { assertEventCoreDispositionCommand, assertEventCoreDispositionSelection,
  assertEventCoreCoverCleanupLimit, readEventCoreCoverCleanupClaim, readEventCoreCoverCleanupJob,
  readEventCoreCoverCleanupReceipt, readAdminEventCoreDispositionPreview,
  readAdminEventCoreDispositionResult } from '../../reads/events/admin-event-core-disposition.contract';
import type { AdminGlobalEventPagePreview } from '../../interfaces/i-admin-global-event-preview';
import { readAdminGlobalEventPagePreview } from '../../reads/events/admin-global-event-preview.contract';
import type { AdminGlobalPublicationPreview, AdminGlobalPublicationResult, AdminGlobalScopePublicationPreview,
  AdminGlobalScopePublicationResult, EventGlobalScopePublicationCommand } from '../../interfaces/i-admin-global-event-publication';
import { assertGlobalScopePublicationCommand, assertGlobalScopePublicationPreview, assertGlobalScopePublicationResult } from '../../reads/events/admin-global-scope-publication.contract';
import { readAdminEventOfflineSeats, readAdminEventOfflineSeatsAdjustment } from '../../reads/events/admin-event-offline-seats.contract';
import type { AdminEventPolicyDraft, AdminEventPolicyPreview, AdminEventPolicySave, PolicyDocument } from '../../interfaces/i-admin-event-policy';
import type {
  AddAdminGlobalEventCityPayload,
  AddAdminGlobalEventCityResult,
  AdminDatedTimeBlocksPreview,
  AdminDatedTimeBlocksSave,
  AdminGlobalBaseTimeBlocksPreview,
  AdminGlobalBaseTimeBlocksSave,
  AdminEffectivePolicyResult,
  AdminGlobalCalendarResult,
  AdminGlobalCalendarPreview,
  AdminGlobalCalendarSave,
  AdminGlobalCalendarApply,
  EventGlobalCalendarChange,
  CreateAdminGlobalEventPayload,
  CreateAdminGlobalEventResult,
  EventDatedTimeBlocksCommand,
  EventGlobalBaseTimeBlocksCommand,
  SaveAdminGlobalEventEditionMetadataPayload,
  SaveAdminGlobalEventEditionMetadataResult,
} from '../../interfaces/i-admin-global-event';
import {
  AdminEventProgramParticipants,
  AdminEventCoreDispositionPreview,
  AdminEventCoreDispositionResult,
  EventCoreDispositionCommand,
  EventCoreCoverCleanupJob,
  EventCoreCoverCleanupReceipt,
  AdminEventProgramOfflineSeats,
  AdminEventProgramOfflineSeatsAdjustment,
  EventOfflineSeatsDelta,
  IAdminEventDetail,
  IAdminEventListItem,
  IEventCoreDetail,
  IEventCoreListItem,
  IEventCoreSavePayload,
} from '../../interfaces/i-event-admin';
import { Backend } from '../backend/backend';
import { assertEdgeContract, createEdgeLiteralReader, readEdgeNullableString, readEdgeUuid } from '../../utils/edge-contract';
import { createStrictEdgeObjectReader } from '../../utils/strict-edge-contract';

@Injectable({ providedIn: 'root' })
export class EventAdmin {
  private readonly backend = inject(Backend);

  getCoreList(includeArchived = false): Observable<IEventCoreListItem[]> {
    return this.backend.rpc<unknown>(EVENT_RPC.getCoreList, { p_include_archived: includeArchived })
      .pipe(map(value => readAdminEventCoreList(value, includeArchived)));
  }

  getCoreDetail(coreId: string): Observable<IEventCoreDetail | null> {
    return this.backend.rpc<unknown>(
      EVENT_RPC.getCoreDetail,
      { p_event_core_id: coreId },
    ).pipe(map(value => readAdminEventCoreDetail(value, coreId)));
  }

  previewCoreDisposition(coreIds: readonly string[]): Observable<AdminEventCoreDispositionPreview> {
    return defer(() => {
      assertEventCoreDispositionSelection(coreIds);
      return this.backend.rpc<unknown>(EVENT_RPC.previewCoreDisposition, { p_core_ids: coreIds });
    }).pipe(map(value => readAdminEventCoreDispositionPreview(value, coreIds)));
  }

  applyCoreDisposition(command: EventCoreDispositionCommand,
    preview: AdminEventCoreDispositionPreview): Observable<AdminEventCoreDispositionResult> {
    return defer(() => {
      assertEventCoreDispositionCommand(command, preview);
      return this.backend.rpc<unknown>(EVENT_RPC.applyCoreDisposition, {
        p_request_id: command.requestId, p_core_ids: command.coreIds, p_expected_plan_hash: command.planHash,
      });
    }).pipe(map(value => readAdminEventCoreDispositionResult(value, command, preview)));
  }

  claimCoreCoverCleanup(limit = 20): Observable<EventCoreCoverCleanupJob[]> {
    return defer(() => {
      assertEventCoreCoverCleanupLimit(limit);
      return this.backend.rpc<unknown>(EVENT_RPC.coreCoverCleanupWorker, { p_operation: 'claim', p_limit: limit });
    }).pipe(map(value => readEventCoreCoverCleanupClaim(value, limit)));
  }

  completeCoreCoverCleanup(job: EventCoreCoverCleanupJob, error: string | null): Observable<EventCoreCoverCleanupReceipt> {
    return defer(() => {
      readEventCoreCoverCleanupJob(job, 'disposition.cleanup.job');
      assertEdgeContract(error === null || (typeof error === 'string' && error.length <= 500),
        'disposition.cleanup.error', 'null or a sanitized error of at most 500 characters');
      return this.backend.rpc<unknown>(EVENT_RPC.coreCoverCleanupWorker, {
        p_operation: 'complete', p_job_id: job.jobId, p_claim_token: job.claimToken, p_error: error,
      });
    }).pipe(map(value => readEventCoreCoverCleanupReceipt(value, job.jobId, error)));
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

  previewGlobalEventPage(coreId: string, selectedEditionId?: string, selectedDate?: string): Observable<AdminGlobalEventPagePreview> {
    return this.backend.rpc<AdminGlobalEventPagePreview>(EVENT_RPC.previewGlobalEventPage, {
      p_payload: { coreId, ...(selectedEditionId ? { selectedEditionId } : {}), ...(selectedDate ? { selectedDate } : {}) },
    }).pipe(map(result => readAdminGlobalEventPagePreview(result, coreId, selectedEditionId, selectedDate)));
  }

  previewGlobalPublication(coreId: string): Observable<AdminGlobalPublicationPreview> {
    return this.backend.rpc<AdminGlobalPublicationPreview>(EVENT_RPC.previewGlobalPublication, { p_core_id: coreId });
  }

  publishGlobalEvent(coreId: string, policyDraftRevision: number): Observable<AdminGlobalPublicationResult> {
    return this.backend.rpc<AdminGlobalPublicationResult>(EVENT_RPC.publishGlobalEvent, {
      p_core_id: coreId, p_expected_policy_draft_revision: policyDraftRevision,
    });
  }

  previewGlobalScopePublication(command: EventGlobalScopePublicationCommand): Observable<AdminGlobalScopePublicationPreview> {
    return this.scopePublication(EVENT_RPC.previewGlobalScopePublication, command, assertGlobalScopePublicationPreview);
  }

  publishGlobalScope(command: EventGlobalScopePublicationCommand): Observable<AdminGlobalScopePublicationResult> {
    return this.scopePublication(EVENT_RPC.publishGlobalScope, command, assertGlobalScopePublicationResult);
  }

  openSignup(occurrenceId: string): Observable<void> {
    return this.backend.rpc<unknown>(EVENT_RPC.setParticipantSignupState, {
      p_occurrence_id: occurrenceId, p_open: true,
    }).pipe(map(response => {
      const result = createStrictEdgeObjectReader({
        occurrenceId: readEdgeUuid,
        status: createEdgeLiteralReader(Object.values(EventOccurrenceStatus)),
        participantSignupKind: createEdgeLiteralReader(Object.values(ParticipantSignupKind)),
        capacityPolicy: createEdgeLiteralReader(['independent', 'legacy_shared']),
        participantSignupOpenedAt: readEdgeNullableString,
        participantSignupOpensAt: readEdgeNullableString,
        participantSignupClosesAt: readEdgeNullableString,
      })(response, 'participantSignupState');
      assertEdgeContract(result.occurrenceId === occurrenceId && result.status === EventOccurrenceStatus.ParticipantSignupOpen &&
        result.participantSignupOpenedAt !== null && Number.isFinite(Date.parse(result.participantSignupOpenedAt)),
      'participantSignupState', 'the requested occurrence with confirmed signup opening');
    }));
  }

  private scopePublication<T>(rpc: typeof EVENT_RPC.previewGlobalScopePublication | typeof EVENT_RPC.publishGlobalScope,
    command: EventGlobalScopePublicationCommand, assertResult: (result: T, command: EventGlobalScopePublicationCommand) => void): Observable<T> {
    return defer(() => {
      assertGlobalScopePublicationCommand(command);
      return this.backend.rpc<T>(rpc, { p_core_id: command.coreId, p_expected_calendar_revision: command.expectedCalendarRevision,
        p_edition_ids: command.editionIds, p_global_date_ids: command.globalDateIds });
    }).pipe(tap(result => assertResult(result, command)));
  }

  previewGlobalBaseTimeBlocks(command: EventGlobalBaseTimeBlocksCommand): Observable<AdminGlobalBaseTimeBlocksPreview> {
    return this.backend.rpc<AdminGlobalBaseTimeBlocksPreview>(EVENT_RPC.previewGlobalBaseTimeBlocks, {
      p_core_id: command.coreId,
      p_expected_calendar_revision: command.expectedCalendarRevision,
      p_time_blocks: command.timeBlocks,
    });
  }

  saveGlobalBaseTimeBlocks(command: EventGlobalBaseTimeBlocksCommand): Observable<AdminGlobalBaseTimeBlocksSave> {
    return this.backend.rpc<AdminGlobalBaseTimeBlocksSave>(EVENT_RPC.saveGlobalBaseTimeBlocks, {
      p_core_id: command.coreId,
      p_expected_calendar_revision: command.expectedCalendarRevision,
      p_time_blocks: command.timeBlocks,
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

  getPolicyDraft(coreId: string): Observable<AdminEventPolicyDraft> {
    return this.backend.rpc<AdminEventPolicyDraft>(EVENT_RPC.getPolicyDraft, { p_core_id: coreId });
  }

  previewPolicyChange(coreId: string, document: PolicyDocument): Observable<AdminEventPolicyPreview> {
    return this.backend.rpc<AdminEventPolicyPreview>(EVENT_RPC.previewPolicyChange, { p_core_id: coreId, p_document: document });
  }

  savePolicyDraft(coreId: string, revision: number, document: PolicyDocument): Observable<AdminEventPolicySave> {
    return this.backend.rpc<AdminEventPolicySave>(EVENT_RPC.savePolicyDraft, {
      p_core_id: coreId, p_expected_revision: revision, p_document: document,
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

  saveGlobalEditionMetadata(payload: SaveAdminGlobalEventEditionMetadataPayload): Observable<SaveAdminGlobalEventEditionMetadataResult> {
    return this.backend.rpc<SaveAdminGlobalEventEditionMetadataResult>(EVENT_RPC.saveGlobalEditionMetadata, { p_payload: payload });
  }

  getTimeline(editionId: string): Observable<AdminEventTimeline> {
    return this.backend.rpc<AdminEventTimeline>(EVENT_RPC.getTimeline, { p_event_id: editionId }).pipe(tap(assertAdminEventTimeline));
  }

  saveManualRpgSlot(payload: ManualRpgSlotPayload): Observable<ManualRpgSlotResult> {
    return this.backend.rpc<ManualRpgSlotResult>(EVENT_RPC.saveManualRpgSlot, { p_payload: payload });
  }

  publishManualRpgSlot(slotId: string, occurrenceId: string, programItemId: string): Observable<ManualRpgPublicationResult> {
    return this.backend.rpc<unknown>(EVENT_RPC.publishManualRpgSlot, { p_slot_id: slotId })
      .pipe(map(value => readManualRpgPublication(value, slotId, occurrenceId, programItemId)));
  }

  getActivityKinds(): Observable<AdminEventActivityKinds> {
    return this.backend.rpc<AdminEventActivityKinds>(EVENT_RPC.getActivityKinds);
  }

  saveManualActivity(payload: ManualActivityPayload): Observable<ManualActivityResult> {
    return this.backend.rpc<ManualActivityResult>(EVENT_RPC.saveManualActivity, { p_payload: payload });
  }

  publishManualActivity(slotId: string, occurrenceId: string, kindKey: string): Observable<ManualActivityPublicationResult> {
    return this.backend.rpc<unknown>(EVENT_RPC.publishManualActivity, { p_slot_id: slotId })
      .pipe(map(value => readManualActivityPublication(value, slotId, occurrenceId, kindKey)));
  }

  getProgramParticipants(programItemId: string, occurrenceId: string): Observable<AdminEventProgramParticipants> {
    return this.backend.rpc<AdminEventProgramParticipants>(EVENT_RPC.getProgramParticipants, {
      p_program_item_id: programItemId,
    }).pipe(tap(data => assertEdgeContract(data.programItemId === programItemId && data.occurrenceId === occurrenceId,
      'programParticipants', 'participants of the selected saved session and occurrence')));
  }

  getProgramOfflineSeats(eventId: string): Observable<AdminEventProgramOfflineSeats> {
    return this.backend.rpc<unknown>(EVENT_RPC.getProgramOfflineSeats, { p_event_id: eventId })
      .pipe(map(response => readAdminEventOfflineSeats(response, eventId)));
  }

  adjustProgramOfflineSeats(programItemId: string, delta: EventOfflineSeatsDelta): Observable<AdminEventProgramOfflineSeatsAdjustment> {
    return this.backend.rpc<unknown>(EVENT_RPC.adjustProgramOfflineSeats, { p_program_item_id: programItemId, p_delta: delta })
      .pipe(map(response => readAdminEventOfflineSeatsAdjustment(response, programItemId, delta)));
  }
}
