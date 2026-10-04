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

@Injectable({ providedIn: 'root' })
export class AdminStaffingRealization {
  private readonly backend = inject(Backend);

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
