import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { STAFFING_REALIZATION_RPC } from '../../configs/staffing-realization-rpc.config';
import type { AdminStaffingAvailability } from '../../interfaces/admin-staffing-availability';
import type { StaffingCandidate } from '../../interfaces/staffing-candidate';
import type { AdminStaffingFinalPlan } from '../../interfaces/admin-staffing-final-plan';
import type { StaffingCandidateSessionProposals } from '../../interfaces/staffing-candidate-session-proposals';
import {
  AdminStaffingRealizationCore,
  AdminStaffingRealizationListItem,
  AdminStaffingSchedule,
} from '../../interfaces/admin-staffing-realization';
import { AdminStaffingTravelTerms } from '../../interfaces/admin-staffing-travel-terms';
import { AdminStaffingRecruitmentPolicy } from '../../interfaces/admin-staffing-recruitment-policy';
import { StaffingRealizationReadinessResult } from '../../interfaces/staffing-realization-readiness';
import { Backend } from '../../services/backend/backend';

@Injectable({ providedIn: 'root' })
export class AdminStaffingRealizationRead {
  private readonly backend = inject(Backend);

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
