import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { COMMERCIAL_CONSTANT_RPC } from '../../configs/commercial-pages.config';
import type {
  CommercialConstantAdminItem,
  CommercialConstantIdRpcPayload,
  CommercialConstantsPublishRpcPayload,
  CommercialConstantSavePayload,
  CommercialConstantSaveRpcPayload,
} from '../../types/commercial-constant-admin';
import { Backend } from '../backend/backend';

@Injectable({ providedIn: 'root' })
export class CommercialConstantAdmin {
  private readonly backend = inject(Backend);

  getList(): Observable<CommercialConstantAdminItem[]> {
    return this.backend.rpc<CommercialConstantAdminItem[]>(
      COMMERCIAL_CONSTANT_RPC.getAdminList,
    );
  }

  save(
    constantId: string | null,
    payload: CommercialConstantSavePayload,
  ): Observable<CommercialConstantAdminItem> {
    const rpcPayload = {
      p_constant_id: constantId,
      p_payload: payload,
    } satisfies CommercialConstantSaveRpcPayload;

    return this.backend.rpc<CommercialConstantAdminItem>(
      COMMERCIAL_CONSTANT_RPC.saveAdmin,
      rpcPayload,
    );
  }

  delete(constantId: string): Observable<void> {
    const payload = {
      p_constant_id: constantId,
    } satisfies CommercialConstantIdRpcPayload;

    return this.backend.rpc<void>(
      COMMERCIAL_CONSTANT_RPC.deleteAdmin,
      payload,
    );
  }

  publish(constantIds: string[]): Observable<CommercialConstantAdminItem[]> {
    const payload = {
      p_constant_ids: constantIds,
    } satisfies CommercialConstantsPublishRpcPayload;

    return this.backend.rpc<CommercialConstantAdminItem[]>(
      COMMERCIAL_CONSTANT_RPC.publishAdmin,
      payload,
    );
  }
}
