import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { STAFFING_REALIZATION_RPC } from '../../configs/staffing-realization-rpc.config';
import {
  AdminStaffingRealizationCore,
  CreateAdminStaffingRealizationCorePayload,
  UpdateAdminStaffingRealizationCorePayload,
} from '../../interfaces/admin-staffing-realization';
import { Backend } from '../backend/backend';

@Injectable({ providedIn: 'root' })
export class AdminStaffingRealization {
  private readonly backend = inject(Backend);

  create(
    payload: CreateAdminStaffingRealizationCorePayload,
  ): Observable<AdminStaffingRealizationCore> {
    return this.backend.rpc<AdminStaffingRealizationCore>(
      STAFFING_REALIZATION_RPC.createAdminCore,
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
}
