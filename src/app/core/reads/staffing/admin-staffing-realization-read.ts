import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { STAFFING_REALIZATION_RPC } from '../../configs/staffing-realization-rpc.config';
import {
  AdminStaffingRealizationCore,
  AdminStaffingSchedule,
} from '../../interfaces/admin-staffing-realization';
import { Backend } from '../../services/backend/backend';

@Injectable({ providedIn: 'root' })
export class AdminStaffingRealizationRead {
  private readonly backend = inject(Backend);

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
}
