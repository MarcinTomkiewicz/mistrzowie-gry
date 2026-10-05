import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { STAFFING_REALIZATION_RPC } from '../../configs/staffing-realization-rpc.config';
import {
  AdminStaffingRealizationCore,
  AdminStaffingSchedule,
  ArchiveAdminStaffingRealizationResult,
  CreateAdminStaffingRealizationRequest,
  CreateAdminStaffingRealizationResult,
  DeleteAdminStaffingRealizationResult,
  SaveAdminStaffingScheduleDayInput,
  UpdateAdminStaffingRealizationCorePayload,
} from '../../interfaces/admin-staffing-realization';
import {
  AdminStaffingTravelTerms,
  SaveAdminStaffingTravelTermsPayload,
} from '../../interfaces/admin-staffing-travel-terms';
import { Backend } from '../backend/backend';
import { AdminStaffingRecruitmentPolicy, SaveAdminStaffingRecruitmentPolicyPayload } from '../../interfaces/admin-staffing-recruitment-policy';
import { OpenAdminStaffingRealizationResult } from '../../interfaces/staffing-realization-readiness';
import type { StaffingCandidate } from '../../interfaces/staffing-candidate';

@Injectable({ providedIn: 'root' })
export class AdminStaffingRealization {
  private readonly backend = inject(Backend);

  createProposal(realizationId: string, gmUserId: string, dayIds: string[] | null): Observable<StaffingCandidate> {
    return this.backend.rpc<StaffingCandidate>(STAFFING_REALIZATION_RPC.createAdminProposal, {
      p_realization_id: realizationId,
      p_gm_user_id: gmUserId,
      p_day_ids: dayIds,
    });
  }

  decideSelfApplication(candidateId: string, decision: 'accepted' | 'rejected'): Observable<StaffingCandidate> {
    return this.backend.rpc<StaffingCandidate>(STAFFING_REALIZATION_RPC.decideAdminSelfApplication, {
      p_candidate_id: candidateId,
      p_decision: decision,
    });
  }

  open(realizationId: string): Observable<OpenAdminStaffingRealizationResult> {
    return this.backend.rpc<OpenAdminStaffingRealizationResult>(
      STAFFING_REALIZATION_RPC.openAdmin,
      { p_realization_id: realizationId },
    );
  }

  delete(realizationId: string): Observable<DeleteAdminStaffingRealizationResult> {
    return this.backend.rpc<DeleteAdminStaffingRealizationResult>(
      STAFFING_REALIZATION_RPC.deleteAdmin,
      { p_realization_id: realizationId },
    );
  }

  archive(realizationId: string): Observable<ArchiveAdminStaffingRealizationResult> {
    return this.backend.rpc<ArchiveAdminStaffingRealizationResult>(
      STAFFING_REALIZATION_RPC.archiveAdmin,
      { p_realization_id: realizationId },
    );
  }

  saveRecruitmentPolicy(
    realizationId: string,
    payload: SaveAdminStaffingRecruitmentPolicyPayload,
  ): Observable<AdminStaffingRecruitmentPolicy> {
    return this.backend.rpc<AdminStaffingRecruitmentPolicy>(
      STAFFING_REALIZATION_RPC.saveAdminRecruitmentPolicy,
      { p_realization_id: realizationId, p_payload: payload },
    );
  }

  create(
    payload: CreateAdminStaffingRealizationRequest,
  ): Observable<CreateAdminStaffingRealizationResult> {
    return this.backend.rpc<CreateAdminStaffingRealizationResult>(
      STAFFING_REALIZATION_RPC.createAdmin,
      { p_payload: payload },
    );
  }

  update(
    realizationId: string,
    payload: UpdateAdminStaffingRealizationCorePayload,
  ): Observable<AdminStaffingRealizationCore> {
    return this.backend.rpc<AdminStaffingRealizationCore>(
      STAFFING_REALIZATION_RPC.updateAdminCore,
      {
        p_realization_id: realizationId,
        p_payload: payload,
      },
    );
  }

  saveSchedule(
    realizationId: string,
    days: SaveAdminStaffingScheduleDayInput[],
  ): Observable<AdminStaffingSchedule> {
    return this.backend.rpc<AdminStaffingSchedule>(
      STAFFING_REALIZATION_RPC.saveAdminSchedule,
      {
        p_realization_id: realizationId,
        p_days: days,
      },
    );
  }

  saveTravelTerms(
    realizationId: string,
    payload: SaveAdminStaffingTravelTermsPayload,
  ): Observable<AdminStaffingTravelTerms> {
    return this.backend.rpc<AdminStaffingTravelTerms>(
      STAFFING_REALIZATION_RPC.saveAdminTravelTerms,
      {
        p_realization_id: realizationId,
        p_payload: payload,
      },
    );
  }
}
