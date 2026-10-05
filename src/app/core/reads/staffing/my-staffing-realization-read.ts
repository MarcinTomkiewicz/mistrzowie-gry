import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { STAFFING_REALIZATION_RPC } from '../../configs/staffing-realization-rpc.config';
import type {
  MyStaffingRealizationDetail,
  MyStaffingRealizationHub,
  StaffingReplacementCandidate,
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

  getReplacementCandidates(candidateId: string): Observable<StaffingReplacementCandidate[]> {
    return this.backend.rpc<StaffingReplacementCandidate[]>(
      STAFFING_REALIZATION_RPC.listMyReplacementCandidates,
      { p_candidate_id: candidateId },
    );
  }
}
