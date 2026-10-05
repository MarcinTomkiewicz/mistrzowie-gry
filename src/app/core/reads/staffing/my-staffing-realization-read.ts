import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { STAFFING_REALIZATION_RPC } from '../../configs/staffing-realization-rpc.config';
import type {
  MyStaffingRealizationDetail,
  MyStaffingRealizationHub,
} from '../../interfaces/my-staffing-realization';
import { Backend } from '../../services/backend/backend';

@Injectable({ providedIn: 'root' })
export class MyStaffingRealizationRead {
  private readonly backend = inject(Backend);

  getHub(): Observable<MyStaffingRealizationHub> {
    return this.backend.rpc<MyStaffingRealizationHub>(
      STAFFING_REALIZATION_RPC.getMyHub,
    );
  }

  getDetail(realizationId: string): Observable<MyStaffingRealizationDetail> {
    return this.backend.rpc<MyStaffingRealizationDetail>(
      STAFFING_REALIZATION_RPC.getMyDetail,
      { p_realization_id: realizationId },
    );
  }
}
