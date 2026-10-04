import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { STAFFING_REALIZATION_RPC } from '../../configs/staffing-realization-rpc.config';
import {
  AdminStaffingRealizationCore,
  AdminStaffingSchedule,
  CreateAdminStaffingRealizationRequest,
  CreateAdminStaffingRealizationResult,
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

@Injectable({ providedIn: 'root' })
export class AdminStaffingRealization {
  private readonly backend = inject(Backend);

  open(realizationId: string): Observable<OpenAdminStaffingRealizationResult> {
    return this.backend.rpc<OpenAdminStaffingRealizationResult>(
      STAFFING_REALIZATION_RPC.openAdmin,
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
