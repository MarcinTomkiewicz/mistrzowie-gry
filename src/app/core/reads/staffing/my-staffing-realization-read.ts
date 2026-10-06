import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { STAFFING_REALIZATION_RPC } from '../../configs/staffing-realization-rpc.config';
import type {
  MyStaffingRealizationDetail,
  MyStaffingRealizationHub,
  StaffingReplacementCandidate,
} from '../../interfaces/my-staffing-realization';
import type { StaffingCandidateSessionProposals } from '../../interfaces/staffing-candidate-session-proposals';
import type { StaffingCandidateThread } from '../../interfaces/staffing-candidate-thread';
import { Backend } from '../../services/backend/backend';

@Injectable({ providedIn: 'root' })
export class MyStaffingRealizationRead {
  private readonly backend = inject(Backend);

  getCandidateThread(candidateId: string): Observable<StaffingCandidateThread> {
    return this.backend.rpc<StaffingCandidateThread>(STAFFING_REALIZATION_RPC.getMyCandidateThread, {
      p_candidate_id: candidateId,
    });
  }

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

  getSessionProposals(candidateId: string): Observable<StaffingCandidateSessionProposals> {
    return this.backend.rpc<StaffingCandidateSessionProposals>(
      STAFFING_REALIZATION_RPC.getMySessionProposals,
      { p_candidate_id: candidateId },
    );
  }
}
