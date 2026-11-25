import { inject, Injectable } from '@angular/core';
import { finalize, from, map, switchMap } from 'rxjs';

import { CONTRACT_TEMPLATE_PDF_PATH_PREFIX } from '../../configs/admin-contract-templates.config';
import type { EdgeReader } from '../../types/edge-contract';
import { assertEdgeContract } from '../../utils/edge-contract';
import { fetchPrivatePdf } from '../../utils/private-pdf';
import { Backend } from '../backend/backend';
import {
  type ContractTemplateUpload,
  readActiveTemplate,
  readDeletedTemplate,
  readStagedTemplate,
  readTemplateDownload,
  readTemplates,
} from './admin-contract-templates.contract';

type ContractTemplateArtifact = 'template' | 'active_template';

@Injectable({ providedIn: 'root' })
export class AdminContractTemplates {
  private readonly backend = inject(Backend);

  list() {
    return this.invoke({ action: 'listTemplates' }, readTemplates);
  }

  upload({ family, file }: ContractTemplateUpload) {
    const body = new FormData();
    body.append('action', 'uploadTemplate');
    body.append('family', family);
    body.append('file', file);
    return this.invoke(body, readStagedTemplate).pipe(map((result) => {
      assertEdgeContract(result.family === family, 'response.data.family', 'the requested family');
      return result;
    }));
  }

  approve(templateId: string) {
    return this.invoke({
      action: 'approveTemplate',
      template_id: templateId,
    }, readActiveTemplate).pipe(map((result) => {
      assertEdgeContract(result.template_id === templateId, 'response.data.template_id', 'the requested template');
      return result;
    }));
  }

  deleteTemplate(templateId: string, confirmActive: boolean) {
    return this.invoke({
      action: 'deleteTemplate',
      template_id: templateId,
      confirm_active: confirmActive,
    }, readDeletedTemplate).pipe(map((result) => {
      assertEdgeContract(result.template_id === templateId, 'response.data.template_id', 'the requested template');
      return result;
    }));
  }

  getDownloadUrl(templateId: string, artifactType: ContractTemplateArtifact = 'template') {
    return this.invoke({
      action: 'getDownloadUrl',
      artifact_type: artifactType,
      artifact_id: templateId,
    }, readTemplateDownload);
  }

  downloadPdf(templateId: string, artifactType: ContractTemplateArtifact = 'template') {
    return this.getDownloadUrl(templateId, artifactType).pipe(switchMap(({ url, filename }) => {
      const controller = new AbortController();
      return from(fetchPrivatePdf(url, CONTRACT_TEMPLATE_PDF_PATH_PREFIX, controller.signal)).pipe(
        map((blob) => ({ blob, filename })),
        finalize(() => controller.abort()),
      );
    }));
  }

  private invoke<TResult, TBody>(body: TBody, reader: EdgeReader<TResult>) {
    return this.backend.invokeEdgeParsed('admin-client-contracts', { method: 'POST', body }, reader);
  }
}
