import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';

import { STAFFING_REALIZATION_RPC } from '../../configs/staffing-realization-rpc.config';
import type { AdminStaffingAvailability } from '../../interfaces/admin-staffing-availability';
import type { StaffingCandidate } from '../../interfaces/staffing-candidate';
import type { AdminStaffingFinalPlan } from '../../interfaces/admin-staffing-final-plan';
import type { StaffingCandidateSessionProposals } from '../../interfaces/staffing-candidate-session-proposals';
import type { StaffingCandidateThread } from '../../interfaces/staffing-candidate-thread';
import {
  AdminStaffingRealizationCore,
  AdminStaffingRealizationListItem,
  AdminStaffingSchedule,
  ConvertAdminStaffingRealizationToEventResult,
} from '../../interfaces/admin-staffing-realization';
import { AdminStaffingTravelTerms } from '../../interfaces/admin-staffing-travel-terms';
import { AdminStaffingRecruitmentPolicy } from '../../interfaces/admin-staffing-recruitment-policy';
import { StaffingRealizationReadinessResult } from '../../interfaces/staffing-realization-readiness';
import { Backend } from '../../services/backend/backend';
import { EventAdmin } from '../../services/event-admin/event-admin';
import { assertEdgeContract } from '../../utils/edge-contract';
import { assertAdminEventTimelineScope } from '../events/admin-event-timeline.contract';
import { assertStaffingEventImportReadback } from './staffing-event-conversion.contract';

@Injectable({ providedIn: 'root' })
export class AdminStaffingRealizationRead {
  private readonly backend = inject(Backend);
  private readonly eventAdmin = inject(EventAdmin);

  readEventTarget(realizationId: string, result: ConvertAdminStaffingRealizationToEventResult | null = null) {
    return this.getDetail(realizationId).pipe(switchMap(realization => {
      assertEdgeContract(realization.id === realizationId && (!result || realization.eventId === result.eventId),
        'staffingConversion.source', 'the saved realization and its confirmed Edition link');
      if (realization.eventId === null) return of(null);
      const eventId = realization.eventId;
      return this.eventAdmin.getEditionDetail(eventId).pipe(switchMap(edition => {
        assertEdgeContract(edition !== null && edition.id === eventId && (!result || edition.eventCoreId === result.eventCoreId),
          'staffingConversion.edition', 'the Edition referenced by the saved realization');
        return forkJoin({ core: this.eventAdmin.getCoreDetail(edition.eventCoreId), timeline: this.eventAdmin.getTimeline(eventId) }).pipe(
          switchMap(({ core, timeline }) => {
            assertEdgeContract(core !== null && core.id === edition.eventCoreId && core.editions.some(row => row.id === eventId),
              'staffingConversion.core', 'the canonical Core containing the linked Edition');
            const target = { realization, eventCoreId: core.id, eventId };
            if (edition.isStaffingConverted) {
              assertEdgeContract(result === null, 'staffingConversion.history', 'no Global import confirmation for a historical conversion');
              assertAdminEventTimelineScope(timeline, edition, core.id);
              return of(target);
            }
            return forkJoin({ calendar: this.eventAdmin.getGlobalCalendar(core.id), policy: this.eventAdmin.getEffectivePolicy(core.id) }).pipe(
              map(({ calendar, policy }) => {
                assertStaffingEventImportReadback(core, edition, calendar, policy, timeline, result);
                return target;
              }),
            );
          }),
        );
      }));
    }));
  }

  getCandidateThread(candidateId: string): Observable<StaffingCandidateThread> {
    return this.backend.rpc<StaffingCandidateThread>(STAFFING_REALIZATION_RPC.getAdminCandidateThread, {
      p_candidate_id: candidateId,
    });
  }

  getFinalPlan(realizationId: string): Observable<AdminStaffingFinalPlan> {
    return this.backend.rpc<AdminStaffingFinalPlan>(STAFFING_REALIZATION_RPC.getAdminFinalPlan, {
      p_realization_id: realizationId,
    });
  }

  getCandidateSessionProposals(candidateId: string): Observable<StaffingCandidateSessionProposals> {
    return this.backend.rpc<StaffingCandidateSessionProposals>(STAFFING_REALIZATION_RPC.getAdminSessionProposals, {
      p_candidate_id: candidateId,
    });
  }

  getList(): Observable<AdminStaffingRealizationListItem[]> {
    return this.backend.rpc<AdminStaffingRealizationListItem[]>(
      STAFFING_REALIZATION_RPC.getAdminList,
    );
  }

  getCandidates(realizationId: string): Observable<StaffingCandidate[]> {
    return this.backend.rpc<StaffingCandidate[]>(
      STAFFING_REALIZATION_RPC.getAdminCandidates,
      { p_realization_id: realizationId },
    );
  }

  getAvailability(realizationId: string): Observable<AdminStaffingAvailability> {
    return this.backend.rpc<AdminStaffingAvailability>(
      STAFFING_REALIZATION_RPC.getAdminAvailability,
      { p_realization_id: realizationId },
    );
  }

  validate(realizationId: string): Observable<StaffingRealizationReadinessResult> {
    return this.backend.rpc<StaffingRealizationReadinessResult>(
      STAFFING_REALIZATION_RPC.validateAdmin,
      { p_realization_id: realizationId },
    );
  }

  getRecruitmentPolicy(realizationId: string): Observable<AdminStaffingRecruitmentPolicy | null> {
    return this.backend.rpc<AdminStaffingRecruitmentPolicy | null>(
      STAFFING_REALIZATION_RPC.getAdminRecruitmentPolicy,
      { p_realization_id: realizationId },
    );
  }

  getDetail(realizationId: string): Observable<AdminStaffingRealizationCore> {
    return this.backend.rpc<AdminStaffingRealizationCore>(
      STAFFING_REALIZATION_RPC.getAdminDetail,
      { p_realization_id: realizationId },
    );
  }

  getSchedule(realizationId: string): Observable<AdminStaffingSchedule> {
    return this.backend.rpc<AdminStaffingSchedule>(
      STAFFING_REALIZATION_RPC.getAdminSchedule,
      { p_realization_id: realizationId },
    );
  }

  getTravelTerms(realizationId: string): Observable<AdminStaffingTravelTerms | null> {
    return this.backend.rpc<AdminStaffingTravelTerms | null>(
      STAFFING_REALIZATION_RPC.getAdminTravelTerms,
      { p_realization_id: realizationId },
    );
  }
}
